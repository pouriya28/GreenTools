<?php

use App\Enums\PurchaseRequirement;
use App\Enums\StockStatus;
use App\Exceptions\Cart\CartVersionConflictException;
use App\Exceptions\Cart\InsufficientStockException;
use App\Exceptions\Cart\ProductUnavailableException;
use App\Exceptions\Cart\PurchaseConfirmationRequiredException;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\User;
use App\Services\Cart\CartService;
use Illuminate\Support\Facades\Http;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

// ---------------------------------------------------------------------------
// Resolve real service via DI (StockAvailabilityService + PricingService injected).
// ---------------------------------------------------------------------------
function svc(): CartService
{
    return app(CartService::class);
}

beforeEach(function () {
    Http::preventStrayRequests();
});

// ===========================================================================
// addItem — happy path
// ===========================================================================

it('addItem creates a CartItem with a correct price snapshot', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create(['version' => 1]);
    $product = makePurchasableProduct(); // price_toman = 1_500_000

    $item = svc()->addItem($cart, $product->id, 2);

    expect($item->quantity)->toBe(2)
        ->and($item->price_at_addition)->toBe(1_500_000)
        ->and($item->discount_at_addition)->toBe(0)
        ->and($item->purchase_requirement_at_addition)->toBe(PurchaseRequirement::Standard->value)
        ->and($item->purchase_confirmed)->toBeFalse();
});

it('addItem bumps the cart version', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create(['version' => 1]);
    $product = makePurchasableProduct();

    svc()->addItem($cart, $product->id, 1);

    expect($cart->fresh()->version)->toBe(2);
});

it('addItem accumulates quantity when the same product is added twice', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create(['version' => 1]);
    $product = makePurchasableProduct(['stock_quantity' => 10]);

    svc()->addItem($cart->fresh(), $product->id, 3);
    svc()->addItem($cart->fresh(), $product->id, 4);

    $item = CartItem::where('cart_id', $cart->id)->sole();
    expect($item->quantity)->toBe(7);
});

it('addItem records purchase_requirement snapshot from product', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create();
    $product = makePurchasableProduct([
        'purchase_requirement' => PurchaseRequirement::TechnicalConsultation,
    ]);

    $item = svc()->addItem($cart, $product->id, 1, purchaseConfirmed: true);

    expect($item->purchase_requirement_at_addition)
        ->toBe(PurchaseRequirement::TechnicalConsultation->value);
});

// ===========================================================================
// addItem — guard rails
// ===========================================================================

it('addItem throws ProductUnavailableException for an inactive product', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create();
    $product = makePurchasableProduct(['is_active' => false]);

    expect(fn () => svc()->addItem($cart, $product->id, 1))
        ->toThrow(ProductUnavailableException::class);
});

it('addItem throws InsufficientStockException when stock_status is OutOfStock', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create();
    $product = makePurchasableProduct([
        'stock_status'   => StockStatus::OutOfStock,
        'stock_quantity' => 0,
    ]);

    expect(fn () => svc()->addItem($cart, $product->id, 1))
        ->toThrow(InsufficientStockException::class);
});

it('addItem throws InsufficientStockException when quantity exceeds available stock', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create();
    $product = makePurchasableProduct(['stock_quantity' => 2]);

    expect(fn () => svc()->addItem($cart, $product->id, 5))
        ->toThrow(InsufficientStockException::class);
});

it('addItem throws InvalidArgumentException for quantity = 0', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create();
    $product = makePurchasableProduct();

    expect(fn () => svc()->addItem($cart, $product->id, 0))
        ->toThrow(\InvalidArgumentException::class);
});

it('addItem throws InvalidArgumentException for quantity > 20 (MAX_QUANTITY_PER_ITEM)', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create();
    $product = makePurchasableProduct(['stock_quantity' => 100]);

    expect(fn () => svc()->addItem($cart, $product->id, 21))
        ->toThrow(\InvalidArgumentException::class);
});

it('addItem throws PurchaseConfirmationRequiredException when confirmation is absent', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create();
    $product = makePurchasableProduct(['purchase_confirmation_required' => true]);

    expect(fn () => svc()->addItem($cart, $product->id, 1, purchaseConfirmed: false))
        ->toThrow(PurchaseConfirmationRequiredException::class);
});

it('addItem throws PurchaseConfirmationRequiredException for non-Standard requirement', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create();
    $product = makePurchasableProduct([
        'purchase_requirement' => PurchaseRequirement::Restricted,
    ]);

    expect(fn () => svc()->addItem($cart, $product->id, 1, purchaseConfirmed: false))
        ->toThrow(PurchaseConfirmationRequiredException::class);
});

it('addItem does not modify the cart when it throws an exception (transaction rollback)', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create(['version' => 1]);
    $product = makePurchasableProduct(['stock_quantity' => 1]);

    // This will fail with InsufficientStockException.
    rescue(fn () => svc()->addItem($cart, $product->id, 5));

    expect($cart->fresh()->version)->toBe(1); // unchanged
    expect(CartItem::where('cart_id', $cart->id)->count())->toBe(0);
});

// ===========================================================================
// updateQuantity
// ===========================================================================

it('updateQuantity changes quantity and bumps version', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create(['version' => 1]);
    $product = makePurchasableProduct(['stock_quantity' => 10]);
    $item    = CartItem::factory()->create([
        'cart_id'    => $cart->id,
        'product_id' => $product->id,
        'quantity'   => 2,
    ]);

    $updated = svc()->updateQuantity($cart->fresh(), $item->id, 7, expectedVersion: 1);

    expect($updated->quantity)->toBe(7)
        ->and($cart->fresh()->version)->toBe(2);
});

it('updateQuantity refreshes the price snapshot from the current product', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create(['version' => 1]);
    $product = makePurchasableProduct(); // price_toman = 1_500_000
    $item    = CartItem::factory()->create([
        'cart_id'           => $cart->id,
        'product_id'        => $product->id,
        'price_at_addition' => 999, // stale
    ]);

    $updated = svc()->updateQuantity($cart->fresh(), $item->id, 2, expectedVersion: 1);

    expect($updated->price_at_addition)->toBe(1_500_000); // refreshed, not 999
});

it('updateQuantity throws CartVersionConflictException on a stale version', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create(['version' => 5]);
    $product = makePurchasableProduct();
    $item    = CartItem::factory()->create(['cart_id' => $cart->id, 'product_id' => $product->id]);

    expect(fn () => svc()->updateQuantity($cart, $item->id, 1, expectedVersion: 1))
        ->toThrow(CartVersionConflictException::class);
});

it('updateQuantity throws InvalidArgumentException for quantity = 0', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create(['version' => 1]);
    $product = makePurchasableProduct();
    $item    = CartItem::factory()->create(['cart_id' => $cart->id, 'product_id' => $product->id]);

    expect(fn () => svc()->updateQuantity($cart, $item->id, 0, expectedVersion: 1))
        ->toThrow(\InvalidArgumentException::class);
});

it('updateQuantity throws ProductUnavailableException if product became inactive', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create(['version' => 1]);
    $product = makePurchasableProduct();
    $item    = CartItem::factory()->create(['cart_id' => $cart->id, 'product_id' => $product->id]);

    // Product deactivated after item was added.
    $product->update(['is_active' => false]);

    expect(fn () => svc()->updateQuantity($cart->fresh(), $item->id, 2, expectedVersion: 1))
        ->toThrow(ProductUnavailableException::class);
});

// ===========================================================================
// removeItem
// ===========================================================================

it('removeItem deletes the item and bumps the version', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create(['version' => 1]);
    $product = makePurchasableProduct();
    $item    = CartItem::factory()->create(['cart_id' => $cart->id, 'product_id' => $product->id]);

    svc()->removeItem($cart->fresh(), $item->id, expectedVersion: 1);

    expect(CartItem::find($item->id))->toBeNull()
        ->and($cart->fresh()->version)->toBe(2);
});

it('removeItem throws CartVersionConflictException on a stale version', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create(['version' => 3]);
    $product = makePurchasableProduct();
    $item    = CartItem::factory()->create(['cart_id' => $cart->id, 'product_id' => $product->id]);

    expect(fn () => svc()->removeItem($cart, $item->id, expectedVersion: 1))
        ->toThrow(CartVersionConflictException::class);
});

it('removeItem does not delete the item when a version conflict occurs (transaction rollback)', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create(['version' => 3]);
    $product = makePurchasableProduct();
    $item    = CartItem::factory()->create(['cart_id' => $cart->id, 'product_id' => $product->id]);

    rescue(fn () => svc()->removeItem($cart, $item->id, expectedVersion: 1));

    expect(CartItem::find($item->id))->not->toBeNull(); // item still present
});

// ===========================================================================
// subtotal
// ===========================================================================

it('subtotal sums (price - discount) × quantity across all items', function () {
    $user = User::factory()->create();
    $cart = Cart::factory()->forUser($user)->create();

    CartItem::factory()->create([
        'cart_id'              => $cart->id,
        'product_id'           => makePurchasableProduct()->id,
        'quantity'             => 2,
        'price_at_addition'    => 1_000_000,
        'discount_at_addition' => 100_000,
    ]);
    CartItem::factory()->create([
        'cart_id'              => $cart->id,
        'product_id'           => makePurchasableProduct()->id,
        'quantity'             => 3,
        'price_at_addition'    => 500_000,
        'discount_at_addition' => 0,
    ]);

    // (1_000_000 - 100_000) × 2 + (500_000 - 0) × 3 = 1_800_000 + 1_500_000
    $subtotal = svc()->subtotal($cart->fresh());

    expect($subtotal)->toBe(3_300_000);
});

it('subtotal returns 0 for an empty cart', function () {
    $user = User::factory()->create();
    $cart = Cart::factory()->forUser($user)->create();

    expect(svc()->subtotal($cart))->toBe(0);
});

// ===========================================================================
// totalWeightGrams
// ===========================================================================

it('totalWeightGrams sums weight_grams × quantity for all items', function () {
    $user = User::factory()->create();
    $cart = Cart::factory()->forUser($user)->create();

    $productA = makePurchasableProduct(['weight_grams' => 300]);
    $productB = makePurchasableProduct(['weight_grams' => 500]);

    CartItem::factory()->create(['cart_id' => $cart->id, 'product_id' => $productA->id, 'quantity' => 2]);
    CartItem::factory()->create(['cart_id' => $cart->id, 'product_id' => $productB->id, 'quantity' => 1]);

    // 300 × 2 + 500 × 1 = 1100
    expect(svc()->totalWeightGrams($cart->fresh()))->toBe(1100);
});

it('totalWeightGrams treats null weight_grams as 0', function () {
    $user = User::factory()->create();
    $cart = Cart::factory()->forUser($user)->create();

    $product = makePurchasableProduct(['weight_grams' => null]);
    CartItem::factory()->create(['cart_id' => $cart->id, 'product_id' => $product->id, 'quantity' => 3]);

    expect(svc()->totalWeightGrams($cart->fresh()))->toBe(0);
});
