<?php

namespace App\Traits;

use App\Models\User;
use App\Services\Auth\RefreshTokenService;
use App\Support\RefreshTokenIssued;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cookie;

trait ManagesAuthTokens
{
    /** لاگین/ثبت‌نام: خانواده‌ی توکن جدید می‌سازه. */
    protected function issueTokenPair(User $user, string $tokenName = 'auth_token', array $accessAbilities = ['*']): JsonResponse
    {
        $refresh = app(RefreshTokenService::class)->issueNew($user, request());

        return $this->respondWithTokenPair($user, $refresh, $tokenName, $accessAbilities);
    }

    /** رفرش: از یه RefreshTokenIssued از قبل rotate-شده پاسخ می‌سازه. */
    protected function issueRotatedTokenPair(User $user, RefreshTokenIssued $refresh, string $tokenName = 'auth_token', array $accessAbilities = ['*']): JsonResponse
    {
        return $this->respondWithTokenPair($user, $refresh, $tokenName, $accessAbilities);
    }

    private function respondWithTokenPair(User $user, RefreshTokenIssued $refresh, string $tokenName, array $accessAbilities): JsonResponse
    {
        $accessTokenExpiration = now()->addMinutes(15);

        $accessToken = $user->createToken(
            "{$tokenName}_access",
            $accessAbilities,
            $accessTokenExpiration
        )->plainTextToken;

        $refreshCookie = Cookie::make(
            name: 'refresh_token',
            value: $refresh->plainToken,
            minutes: now()->diffInMinutes($refresh->expiresAt),
            path: '/api/v1/auth/refresh',
            domain: null,
            secure: !app()->environment('local'),
            httpOnly: true,
            raw: false,
            sameSite: app()->environment('local') ? 'lax' : 'none',
        );

        return response()->json([
            'status' => 'success',
            'message' => 'عملیات با موفقیت انجام شد.',
            'data' => [
                'access_token' => $accessToken,
                'token_type' => 'Bearer',
                'expires_in' => 15 * 60,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'type' => $user->user_type,
                ],
            ],
        ], 200)->withCookie($refreshCookie);
    }
/** خروج از همه‌ی دستگاه‌ها — همه‌ی خانواده‌های refresh token کاربر باطل می‌شن. */
    protected function revokeAllSessions(User $user): JsonResponse
    {
        app(\App\Services\Auth\RefreshTokenService::class)->revokeAllForUser($user->id);

        return response()->json([
            'message' => 'از همه‌ی دستگاه‌ها خارج شدید.',
        ], 200)->withoutCookie('refresh_token', '/api/v1/auth/refresh');
    }
}