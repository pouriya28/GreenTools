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

        // Prevent account enumeration: verify the password FIRST and return the
        // same generic message/status for "no such user" and "wrong password".
        // Lockout state is only revealed AFTER the password has been proven
        // correct — otherwise the distinct 423 response below would leak
        // whether a given login exists and is currently locked.
        if (!$user || !Hash::check($request->validated('password'), $user->password)) {
            if ($user) {
                $this->registerFailedAttempt($user);
            }

            return response()->json([
                'message' => 'ایمیل/نام کاربری یا رمز عبور اشتباه است.',
            ], 401);
        }

        // قفل حساب در صورت تلاش‌های ناموفق مکرر (فقط بعد از تایید رمز صحیح بررسی می‌شود)
        if ($user->locked_until && $user->locked_until->isFuture()) {
            $minutesLeft = now()->diffInMinutes($user->locked_until) + 1;

            return response()->json([
                'message' => "حساب شما به دلیل تلاش‌های ناموفق مکرر موقتاً قفل شده است. لطفاً {$minutesLeft} دقیقه دیگر تلاش کنید.",
            ], 423);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'حساب کاربری شما غیرفعال شده است.',
            ], 403);
        }

        // ورود موفق: پاکسازی شمارنده تلاش ناموفق
        if ($user->failed_login_attempts > 0 || $user->locked_until) {
            $user->clearLoginFailures();
        }

        if ($user->two_factor_enabled && $user->two_factor_secret) {
            $tempToken = $user->createToken('2fa_pending_token', ['2fa:pending'], now()->addMinutes(5))->plainTextToken;

            return response()->json([
                'message' => 'کد تایید دو مرحله‌ای را وارد کنید.',
                'requires_2fa' => true,
                'access_token' => $tempToken,
            ], 206);
        }

        $user->recordLogin();

        return $this->issueTokenPair($user, 'staff_auth', ['*']);
    }

    protected function registerFailedAttempt(User $user): void
    {
        $user->increment('failed_login_attempts');

        if ($user->failed_login_attempts >= $this->maxFailedAttempts) {
            $user->applyLockout($this->lockoutMinutes);
        }
    }

    public function verify2fa(AdminVerify2FARequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        // 🔒 فیکس باگ: توکن wildcard نباید بتونه این endpoint رو صدا بزنه
        $abilities = $user->currentAccessToken()?->abilities ?? [];
        if (!in_array('2fa:pending', $abilities, true) || in_array('*', $abilities, true)) {
            return response()->json([
                'success' => false,
                'message' => 'دسترسی غیرمجاز.',
                'code'    => 'FORBIDDEN',
            ], 403);
        }

        $google2fa = new Google2FA();
        $valid = $google2fa->verifyKey($user->two_factor_secret, $request->validated('totp_code'));

        if (!$valid) {
            return response()->json([
                'message' => 'کد تایید دو مرحله‌ای نامعتبر است.',
            ], 422);
        }

        $user->currentAccessToken()->delete();
        $user->recordLogin();

        return $this->issueTokenPair($user, 'staff_auth', ['*']);
    }

    public function setup2fa(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $google2fa = new Google2FA();
        $secret = $google2fa->generateSecretKey();

        $user->setTwoFactorSecret($secret);

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

        $user->enableTwoFactor();

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

        $user->disableTwoFactor();

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

        // Only revoke the CURRENT device's access token. Deleting every token
        // via $user->tokens()->delete() would also sign the user out of every
        // other device — that behavior belongs to the separate logoutAll().
        $user->currentAccessToken()->delete();

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