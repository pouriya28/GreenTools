<?php

namespace App\Http\Middleware;

use App\Models\Cart;
use App\Models\CartItem;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateCartOwnership
{
    /**
     * Ensures the resolved cart (attached by ResolveCart) actually owns any
     * CartItem referenced in the route. Never trusts a cart/item id supplied
     * by the client as proof of ownership by itself.
     */
    public function handle(Request $request, Closure $next)
    {
        /** @var Cart $cart */
        $cart = $request->attributes->get('current_cart');

        $itemId = $request->route('item');

        if ($itemId !== null) {
            $belongs = CartItem::where('id', $itemId)
                ->where('cart_id', $cart->id)
                ->exists();

            if (! $belongs) {
                // Intentionally identical response whether the item exists on
                // another cart or does not exist at all — no enumeration signal.
                return response()->json([
                    'error_code' => 'CART_ITEM_NOT_FOUND',
                    'message' => 'Cart item not found.',
                ], Response::HTTP_NOT_FOUND);
            }
        }

        return $next($request);
    }
}