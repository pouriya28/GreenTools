<?php

namespace App\Traits;

use App\Models\User;
use App\Services\Auth\RefreshTokenService;
use App\Services\Loyalty\LoyaltyPresenter;
use App\Support\RefreshTokenIssued;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cookie;

trait ManagesAuthTokens
{
    private const REFRESH_COOKIE_PATH = '/api/v1/auth';

    // Path used before the cookie-scope fix. Kept here only so we can
    // proactively delete any stale cookie a returning browser might still be
    // holding — without this, the old and new cookies collide and the
    // refresh-token reuse detector wrongly treats it as a stolen token.
    // Safe to remove a few weeks after this ships, once no active session
    // could still be carrying the old cookie.
    private const LEGACY_REFRESH_COOKIE_PATH = '/api/v1/auth/refresh';

    protected function issueTokenPair(User $user, string $tokenName = 'auth_token', array $accessAbilities = ['*']): JsonResponse
    {
        $refresh = app(RefreshTokenService::class)->issueNew($user, request());

        return $this->respondWithTokenPair($user, $refresh, $tokenName, $accessAbilities);
    }

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
            path: self::REFRESH_COOKIE_PATH,
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
                    'phone' => $user->phone,
                    'loyalty' => app(LoyaltyPresenter::class)->present($user),
                ],
            ],
        ], 200)
            ->withCookie($refreshCookie)
            // Self-healing: kills any leftover cookie from the old path so it
            // can never collide with the newly issued one.
            ->withCookie(Cookie::forget('refresh_token', self::LEGACY_REFRESH_COOKIE_PATH));
    }

    protected function revokeAllSessions(User $user): JsonResponse
    {
        app(RefreshTokenService::class)->revokeAllForUser($user->id);

        return response()->json([
            'message' => 'از همه‌ی دستگاه‌ها خارج شدید.',
        ], 200)
            ->withoutCookie('refresh_token', self::REFRESH_COOKIE_PATH)
            ->withCookie(Cookie::forget('refresh_token', self::LEGACY_REFRESH_COOKIE_PATH));
    }
}