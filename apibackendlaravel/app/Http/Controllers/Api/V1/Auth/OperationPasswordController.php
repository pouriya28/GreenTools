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
    // مدت اعتبار تأیید عملیات بعد از verify موفق
    private const VERIFICATION_TTL_SECONDS = 300;

    public function set(SetOperationPasswordRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        // Step-up: login password اثبات می‌کنه که صاحب واقعی حساب پشت کیبورده
        if (!Hash::check($request->validated('current_login_password'), $user->password)) {
            Log::warning('operation_password.set_denied_bad_login_password', ['user_id' => $user->id]);
            throw new InvalidOperationPasswordException();
        }

        $user->forceFill([
            'operation_password_hash' => Hash::make($request->validated('operation_password')),
        ])->save();

        // 🔒 تغییر operation password باید همه session های فعال رو از حالت verified خارج کنه.
        // اگه این invalidation نباشه، session قدیمی تا TTL باقیمانده همچنان verified حساب می‌شه.
        $user->tokens()->each(function ($token) use ($user) {
            Redis::del("op_verified:{$user->id}:{$token->id}");
        });

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

        if (!Hash::check($request->validated('operation_password'), $user->operation_password_hash)) {
            Log::warning('operation_password.verify_failed', ['user_id' => $user->id]);
            throw new InvalidOperationPasswordException();
        }

        // 🔒 verification به session جاری (token ID) وابسته‌ست، نه کل user.
        // تأیید روی دستگاه A برای دستگاه B معتبر نیست.
        $tokenId = $user->currentAccessToken()->id;
        Redis::setex("op_verified:{$user->id}:{$tokenId}", self::VERIFICATION_TTL_SECONDS, '1');

        Log::info('operation_password.verified', ['user_id' => $user->id]);

        return response()->json([
            'message'    => 'عملیات تأیید شد.',
            'expires_in' => self::VERIFICATION_TTL_SECONDS,
        ]);
    }
}
