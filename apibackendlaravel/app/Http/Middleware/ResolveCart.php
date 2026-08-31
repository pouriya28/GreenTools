<?php

namespace App\Http\Middleware;

use App\Models\Cart;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Cookie;

class ResolveCart
{
    private const GUEST_COOKIE_NAME = 'cart_guest_token';
    private const GUEST_COOKIE_MINUTES = 60 * 24 * 30; // 30 days

    /**
     * Attaches the resolved active cart to the request. Never trusts any
     * cart identifier supplied in the request body or query string.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user !== null) {
            $cart = $this->resolveAuthenticatedCart($user->id);
        } else {
            $cart = $this->resolveGuestCart($request);
        }

        $request->attributes->set('current_cart', $cart);

        $response = $next($request);

        if ($user === null && $request->attributes->has('new_guest_token')) {
            $response->headers->setCookie($this->buildGuestCookie(
                $request->attributes->get('new_guest_token')
            ));
        }

        return $response;
    }

    private function resolveAuthenticatedCart(int $userId): Cart
    {
        return Cart::firstOrCreate(
            ['user_id' => $userId, 'status' => 'active'],
            ['version' => 1]
        );
    }

    private function resolveGuestCart(Request $request): Cart
    {
        $token = $request->cookie(self::GUEST_COOKIE_NAME);

        if ($token !== null) {
            $cart = Cart::where('guest_token', $token)
                ->where('status', 'active')
                ->first();

            if ($cart !== null) {
                return $cart;
            }
        }

        // No valid existing guest cart credential — issue a fresh one.
        // 32 random bytes -> 256 bits of entropy, hex-encoded.
        $newToken = bin2hex(random_bytes(32));

        $cart = Cart::create([
            'guest_token' => $newToken,
            'status' => 'active',
            'version' => 1,
        ]);

        $request->attributes->set('new_guest_token', $newToken);

        return $cart;
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