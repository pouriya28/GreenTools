<?php

namespace App\Services\Cart;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\DB;

class CartMergeService
{
    private const MAX_QUANTITY_PER_ITEM = 20;

    /**
     * Merges a guest cart into the authenticated user's active cart.
     * Idempotent: if the guest cart was already converted (e.g. duplicate
     * Login events, or a retried request), this is a safe no-op.
     */
    public function merge(int $userId, string $guestToken): void
    {
        DB::transaction(function () use ($userId, $guestToken) {
            $guestCart = Cart::where('guest_token', $guestToken)
                ->where('status', 'active')
                ->lockForUpdate()
                ->first();

            if ($guestCart === null) {
                return; // Already merged, expired, or never existed.
            }

            $userCart = Cart::firstOrCreate(
                ['user_id' => $userId, 'status' => 'active'],
                ['version' => 1]
            );
            $userCart = Cart::where('id', $userCart->id)->lockForUpdate()->first();

            foreach ($guestCart->items as $guestItem) {
                $this->mergeItem($userCart, $guestItem);
            }

            $guestCart->update(['status' => 'converted']);

            Cart::where('id', $userCart->id)->update(['version' => DB::raw('version + 1')]);
        });

        // Guest credential is no longer valid; drop the cookie on the response.
        Cookie::queue(Cookie::forget('cart_guest_token'));
    }

    private function mergeItem(Cart $userCart, CartItem $guestItem): void
    {
        $product = Product::where('id', $guestItem->product_id)
            ->where('is_active', true)
            ->lockForUpdate()
            ->first();

        if ($product === null) {
            return; // Product no longer purchasable — dropped, not merged.
        }

        $existing = CartItem::where('cart_id', $userCart->id)
            ->where('product_id', $product->id)
            ->first();

        $mergedQuantity = min(
            ($existing?->quantity ?? 0) + $guestItem->quantity,
            self::MAX_QUANTITY_PER_ITEM,
            $product->stock_quantity
        );

        if ($mergedQuantity < 1) {
            return;
        }

        CartItem::updateOrCreate(
            ['cart_id' => $userCart->id, 'product_id' => $product->id],
            [
                // Never trust the guest cart's snapshot price — recalculate from the product now.
                'quantity' => $mergedQuantity,
                'price_at_addition' => $product->price_toman,
                'discount_at_addition' => $product->has_active_discount
                    ? $product->price_toman - $product->final_price
                    : 0,
                'purchase_requirement_at_addition' => $product->purchase_requirement?->value,
                'purchase_confirmed' => $existing?->purchase_confirmed || $guestItem->purchase_confirmed,
            ]
        );
    }
}