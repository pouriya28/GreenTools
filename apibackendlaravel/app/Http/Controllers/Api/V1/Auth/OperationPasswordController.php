<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Exceptions\Auth\InvalidOperationPasswordException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\SetOperationPasswordRequest;
use App\Http\Requests\Api\Auth\VerifyOperationPasswordRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class OperationPasswordController extends Controller
{
    // Matches the short-lived "step-up" window discussed in the architecture:
    // once verified, sensitive actions are allowed for this long before the
    // admin must re-enter the operation password.
    private const VERIFICATION_TTL_SECONDS = 300;

    public function set(SetOperationPasswordRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        // Step-up requirement: knowing the login password proves this is
        // really the account owner acting right now, not just a valid session.
        if (!Hash::check($request->validated('current_login_password'), $user->password)) {
            Log::warning('operation_password.set_denied_bad_login_password', ['user_id' => $user->id]);

            throw new InvalidOperationPasswordException();
        }

        $user->forceFill([
            'operation_password_hash' => Hash::make($request->validated('operation_password')),
        ])->save();

        Log::info('operation_password.set', ['user_id' => $user->id]);

        return response()->json([
            'message' => 'رمز تأیید عملیات با موفقیت تنظیم شد.',
        ]);
    }

    public function verify(VerifyOperationPasswordRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (!$user->operation_password_hash) {
            return response()->json([
                'message' => 'ابتدا باید رمز تأیید عملیات را تنظیم کنید.',
            ], 409);
        }

        // Hash::check() is timing-safe by construction (it wraps
        // password_verify), so no extra hash_equals() layer is needed here.
        if (!Hash::check($request->validated('operation_password'), $user->operation_password_hash)) {
            Log::warning('operation_password.verify_failed', ['user_id' => $user->id]);

            throw new InvalidOperationPasswordException();
        }

        Redis::setex("op_verified:{$user->id}", self::VERIFICATION_TTL_SECONDS, '1');

        Log::info('operation_password.verified', ['user_id' => $user->id]);

        return response()->json([
            'message' => 'عملیات تأیید شد.',
            'expires_in' => self::VERIFICATION_TTL_SECONDS,
        ]);
    }
}