<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\ForgotPasswordRequest;
use App\Http\Requests\Api\Auth\ResetPasswordRequest;
use App\Mail\AdminPasswordResetMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AdminPasswordController extends Controller
{
    protected int $tokenTtlMinutes = 60;

    public function forgot(ForgotPasswordRequest $request): JsonResponse
    {
        $user = User::where('email', $request->validated('email'))
            ->where('user_type', 'staff')
            ->first();

        // پیام همیشه یکسان است تا مشخص نشود ایمیل در سیستم وجود دارد یا نه
        $generic = ['message' => 'اگر این ایمیل در سیستم ثبت شده باشد، لینک بازیابی برای آن ارسال می‌شود.'];

        if ($user) {
            DB::table('password_reset_tokens')->where('email', $user->email)->delete();

            $token = Str::random(64);

            DB::table('password_reset_tokens')->insert([
                'email' => $user->email,
                'token' => Hash::make($token),
                'created_at' => now(),
            ]);

            Mail::to($user->email)->send(new AdminPasswordResetMail($user, $token));
        }

        return response()->json($generic);
    }

    public function reset(ResetPasswordRequest $request): JsonResponse
    {
        $record = DB::table('password_reset_tokens')
            ->where('email', $request->validated('email'))
            ->first();

        if (!$record || !Hash::check($request->validated('token'), $record->token)) {
            return response()->json(['message' => 'لینک بازیابی نامعتبر است.'], 422);
        }

        if (\Illuminate\Support\Carbon::parse($record->created_at)->addMinutes($this->tokenTtlMinutes)->lt(now())) {
            DB::table('password_reset_tokens')->where('email', $request->validated('email'))->delete();

            return response()->json(['message' => 'لینک بازیابی منقضی شده است. دوباره درخواست دهید.'], 422);
        }

        $user = User::where('email', $request->validated('email'))
            ->where('user_type', 'staff')
            ->first();

        if (!$user) {
            return response()->json(['message' => 'کاربر یافت نشد.'], 404);
        }

        $user->password = Hash::make($request->validated('password'));
        $user->save();
        $user->clearLoginFailures();


        // خروج اجباری از تمام نشست‌های فعال پس از تغییر رمز عبور
        $user->tokens()->delete();

        DB::table('password_reset_tokens')->where('email', $request->validated('email'))->delete();

        return response()->json(['message' => 'رمز عبور با موفقیت بازیابی شد. اکنون می‌توانید وارد شوید.']);
    }
}
