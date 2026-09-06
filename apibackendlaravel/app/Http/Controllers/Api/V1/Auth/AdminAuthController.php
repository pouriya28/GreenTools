<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\AdminLoginRequest;
use App\Http\Requests\Api\Auth\AdminVerify2FARequest;
use App\Models\User;
use App\Services\Auth\RefreshTokenService;
use App\Traits\ManagesAuthTokens;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use PragmaRX\Google2FA\Google2FA;

class AdminAuthController extends Controller
{
    use ManagesAuthTokens;

    protected int $maxFailedAttempts = 5;
    protected int $lockoutMinutes = 15;

    public function login(AdminLoginRequest $request): JsonResponse
    {
        $login = $request->validated('login');

        $user = User::where('user_type', 'staff')
            ->where(function ($q) use ($login) {
                $q->where('email', $login)->orWhere('username', $login);
            })
            ->first();

        // قفل حساب در صورت تلاش‌های ناموفق مکرر
        if ($user && $user->locked_until && $user->locked_until->isFuture()) {
            $minutesLeft = now()->diffInMinutes($user->locked_until) + 1;

            return response()->json([
                'message' => "حساب شما به دلیل تلاش‌های ناموفق مکرر موقتاً قفل شده است. لطفاً {$minutesLeft} دقیقه دیگر تلاش کنید.",
            ], 423);
        }

        // جلوگیری از Enumeration Attack: پیام یکسان برای ایمیل/یوزرنیم یا پسورد اشتباه
        if (!$user || !Hash::check($request->validated('password'), $user->password)) {
            if ($user) {
                $this->registerFailedAttempt($user);
            }

            return response()->json([
                'message' => 'ایمیل/نام کاربری یا رمز عبور اشتباه است.',
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'حساب کاربری شما غیرفعال شده است.',
            ], 403);
        }

        // ورود موفق: پاکسازی شمارنده تلاش ناموفق
        if ($user->failed_login_attempts > 0 || $user->locked_until) {
            $user->update(['failed_login_attempts' => 0, 'locked_until' => null]);
        }

        if ($user->two_factor_enabled && $user->two_factor_secret) {
            $tempToken = $user->createToken('2fa_pending_token', ['2fa:pending'])->plainTextToken;

            return response()->json([
                'message' => 'کد تایید دو مرحله‌ای را وارد کنید.',
                'requires_2fa' => true,
                'access_token' => $tempToken,
            ], 206);
        }

        $user->update(['last_login_at' => now()]);

        return $this->issueTokenPair($user, 'staff_auth', ['*']);
    }

    protected function registerFailedAttempt(User $user): void
    {
        $user->increment('failed_login_attempts');

        if ($user->failed_login_attempts >= $this->maxFailedAttempts) {
            $user->update([
                'locked_until' => now()->addMinutes($this->lockoutMinutes),
                'failed_login_attempts' => 0,
            ]);
        }
    }

    public function verify2fa(AdminVerify2FARequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $google2fa = new Google2FA();
        $valid = $google2fa->verifyKey($user->two_factor_secret, $request->validated('totp_code'));

        if (!$valid) {
            return response()->json([
                'message' => 'کد تایید دو مرحله‌ای نامعتبر است.',
            ], 422);
        }

        $user->currentAccessToken()->delete();
        $user->update(['last_login_at' => now()]);

        return $this->issueTokenPair($user, 'staff_auth', ['*']);
    }

    public function setup2fa(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $google2fa = new Google2FA();
        $secret = $google2fa->generateSecretKey();

        $user->update(['two_factor_secret' => $secret]);

        $qrCodeUrl = $google2fa->getQRCodeUrl(
            config('app.name', 'MyStore'),
            $user->email,
            $secret
        );

        return response()->json([
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
            'message' => 'کلید با موفقیت تولید شد. آن را در اپلیکیشن اسکن کنید.',
        ]);
    }

    public function enable2fa(AdminVerify2FARequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (!$user->two_factor_secret) {
            return response()->json(['message' => 'ابتدا باید درخواست setup2fa ارسال کنید.'], 400);
        }

        $google2fa = new Google2FA();
        $valid = $google2fa->verifyKey($user->two_factor_secret, $request->validated('totp_code'));

        if (!$valid) {
            return response()->json(['message' => 'کد وارد شده اشتباه است.'], 422);
        }

        $user->update(['two_factor_enabled' => true]);

        return response()->json(['message' => 'ورود دو مرحله‌ای با موفقیت فعال شد.']);
    }

    public function disable2fa(AdminVerify2FARequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $google2fa = new Google2FA();
        $valid = $google2fa->verifyKey($user->two_factor_secret, $request->validated('totp_code'));

        if (!$valid) {
            return response()->json(['message' => 'کد وارد شده اشتباه است.'], 422);
        }

        $user->update([
            'two_factor_enabled' => false,
            'two_factor_secret' => null,
        ]);

        return response()->json(['message' => 'ورود دو مرحله‌ای غیرفعال شد.']);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $rawRefreshToken = $request->cookie('refresh_token');
        if ($rawRefreshToken) {
            app(RefreshTokenService::class)->revokeByRawToken($rawRefreshToken);
        }

        $user->tokens()->delete();

        return response()->json([
            'message' => 'با موفقیت از حساب کاربری خارج شدید.',
        ], 200)
            ->withoutCookie('refresh_token', '/api/v1/auth')
            ->withCookie(\Illuminate\Support\Facades\Cookie::forget('refresh_token', '/api/v1/auth/refresh'));
    }
    public function logoutAll(Request $request): JsonResponse
        {
            /** @var User $user */
            $user = $request->user();

            return $this->revokeAllSessions($user);
        }
}