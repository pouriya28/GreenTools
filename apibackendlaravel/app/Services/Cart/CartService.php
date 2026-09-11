<?php

namespace App\Services\Cart;

use App\Enums\PurchaseRequirement;
use App\Exceptions\Cart\CartVersionConflictException;
use App\Exceptions\Cart\InsufficientStockException;
use App\Exceptions\Cart\ProductUnavailableException;
use App\Exceptions\Cart\PurchaseConfirmationRequiredException;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Services\Inventory\StockAvailabilityService;
use App\Services\Pricing\PricingService;
use Illuminate\Support\Facades\DB;

class CartService
{
    private const MAX_QUANTITY_PER_ITEM = 20;

    public function __construct(
        private readonly PricingService $pricingService,
        private readonly StockAvailabilityService $stockAvailability,
    ) {
    }

    public function addItem(Cart $cart, int $productId, int $quantity, bool $purchaseConfirmed = false): CartItem
    {
        $this->assertValidQuantity($quantity);

        return DB::transaction(function () use ($cart, $productId, $quantity, $purchaseConfirmed) {
            $product = Product::where('id', $productId)
                ->where('is_active', true)
                ->lockForUpdate()
                ->first();

            if ($product === null) {
                throw new ProductUnavailableException($productId);
            }

            $existing = CartItem::where('cart_id', $cart->id)
                ->where('product_id', $product->id)
                ->first();

            $requestedQuantity = $quantity + ($existing?->quantity ?? 0);

            $this->assertValidQuantity($requestedQuantity);
            $this->assertInStock($product, $requestedQuantity);
            $this->assertPurchaseRequirementSatisfied($product, $purchaseConfirmed);

            $priceSnapshot = $product->price_toman;
            $discountSnapshot = $product->has_active_discount
                ? $priceSnapshot - $product->final_price
                : 0;

            $item = CartItem::updateOrCreate(
                ['cart_id' => $cart->id, 'product_id' => $product->id],
                [
                    'quantity' => $requestedQuantity,
                    'price_at_addition' => $priceSnapshot,
                    'discount_at_addition' => $discountSnapshot,
                    'purchase_requirement_at_addition' => $product->purchase_requirement?->value,
                    'purchase_confirmed' => $purchaseConfirmed || ($existing?->purchase_confirmed ?? false),
                ]
            );

            $this->bumpVersion($cart);

            return $item;
        });
    }

    public function updateQuantity(Cart $cart, int $itemId, int $quantity, int $expectedVersion): CartItem
    {
        $this->assertValidQuantity($quantity);

        return DB::transaction(function () use ($cart, $itemId, $quantity, $expectedVersion) {
            $this->assertVersionMatches($cart, $expectedVersion);

            $item = CartItem::where('id', $itemId)
                ->where('cart_id', $cart->id)
                ->lockForUpdate()
                ->firstOrFail();

            $product = Product::where('id', $item->product_id)
                ->where('is_active', true)
                ->lockForUpdate()
                ->first();

            if ($product === null) {
                throw new ProductUnavailableException($item->product_id);
            }

            $this->assertInStock($product, $quantity);

            $item->update([
                'quantity' => $quantity,
                'price_at_addition' => $product->price_toman,
                'discount_at_addition' => $product->has_active_discount
                    ? $product->price_toman - $product->final_price
                    : 0,
            ]);

            $this->bumpVersion($cart);

            return $item->refresh();
        });
    }

    public function removeItem(Cart $cart, int $itemId, int $expectedVersion): void
    {
        DB::transaction(function () use ($cart, $itemId, $expectedVersion) {
            $this->assertVersionMatches($cart, $expectedVersion);

            CartItem::where('id', $itemId)
                ->where('cart_id', $cart->id)
                ->delete();

            $this->bumpVersion($cart);
        });
    }

    private function assertValidQuantity(int $quantity): void
    {
        if ($quantity < 1 || $quantity > self::MAX_QUANTITY_PER_ITEM) {
            throw new \InvalidArgumentException('Quantity must be between 1 and '.self::MAX_QUANTITY_PER_ITEM.'.');
        }
    }

    // Uses StockAvailabilityService instead of raw stock_quantity: an item
    // may already be held by another user's active checkout reservation
    // (InventoryReservation), even though stock_quantity itself is only
    // decremented once a payment actually succeeds. Checking raw
    // stock_quantity here would allow overselling during that window.
    private function assertInStock(Product $product, int $requestedQuantity): void
    {
        if ($product->stock_status?->value === 'out_of_stock') {
            throw new InsufficientStockException($product->id, 0);
        }

        $available = $this->stockAvailability->availableStock($product);

        if ($available < $requestedQuantity) {
            throw new InsufficientStockException($product->id, $available);
        }
    }

    private function assertPurchaseRequirementSatisfied(Product $product, bool $purchaseConfirmed): void
    {
        $requiresConfirmation = $product->purchase_confirmation_required
            || $product->purchase_requirement !== PurchaseRequirement::Standard;

        if ($requiresConfirmation && ! $purchaseConfirmed) {
            throw new PurchaseConfirmationRequiredException($product->id, $product->purchase_requirement);
        }
    }

    private function assertVersionMatches(Cart $cart, int $expectedVersion): void
    {
        $current = Cart::where('id', $cart->id)->value('version');

        if ($current !== $expectedVersion) {
            throw new CartVersionConflictException($current);
        }
    }

    private function bumpVersion(Cart $cart): void
    {
        Cart::where('id', $cart->id)->update(['version' => DB::raw('version + 1')]);
        $cart->refresh();
    }

    public function subtotal(Cart $cart): int
    {
        $cart->loadMissing('items');

        return (int) $cart->items->sum(
            fn (CartItem $item) => ($item->price_at_addition - $item->discount_at_addition) * $item->quantity
        );
    }
    public function totalWeightGrams(Cart $cart): int
    {
        $cart->loadMissing('items.product');

        return (int) $cart->items->sum(
            fn (CartItem $item) => ($item->product->weight_grams ?? 0) * $item->quantity
        );
    }
}