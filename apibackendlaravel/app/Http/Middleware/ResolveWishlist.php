<?php

namespace App\Http\Middleware;

use App\Models\Wishlist;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Cookie;

class ResolveWishlist
{
    private const GUEST_COOKIE_NAME    = 'wishlist_guest_token';
    private const GUEST_COOKIE_MINUTES = 60 * 24 * 10; // 10 days
    private const GUEST_TTL_DAYS       = 10;

    /**
     * Attaches the resolved guest_token (or null for authenticated users)
     * to the request attributes. Never trusts any token from the request body.
     *
     * For authenticated users: identity comes from auth:sanctum, no token needed.
     * For guests: a high-entropy token is issued/read from an HttpOnly cookie.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user === null) {
            $this->resolveGuestToken($request);
        }

        $response = $next($request);

        // Set the guest cookie on the response if a new token was issued
        if ($user === null && $request->attributes->has('new_wishlist_token')) {
            $response->headers->setCookie(
                $this->buildGuestCookie($request->attributes->get('new_wishlist_token'))
            );
        }

        return $response;
    }

    private function resolveGuestToken(Request $request): void
    {
        $token = $request->cookie(self::GUEST_COOKIE_NAME);

        if ($token !== null) {
            // Token exists in cookie — trust it regardless of whether it has
            // DB records yet. A fresh guest may not have added anything yet.
            $request->attributes->set('wishlist_guest_token', $token);
            return;
        }

        // No cookie — issue a fresh token
        $newToken = bin2hex(random_bytes(32));
        $request->attributes->set('wishlist_guest_token', $newToken);
        $request->attributes->set('new_wishlist_token', $newToken);
    }

    private function buildGuestCookie(string $token): Cookie
    {
        return Cookie::create(self::GUEST_COOKIE_NAME)
            ->withValue($token)
            ->withExpires(now()->addMinutes(self::GUEST_COOKIE_MINUTES))
            ->withHttpOnly(true)
            ->withSecure(! app()->isLocal())
            ->withSameSite('lax')
            ->withPath('/');
    }
}
