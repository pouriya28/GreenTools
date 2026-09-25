<?php

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\User;
use App\Services\Cart\CartMergeService;
use Illuminate\Support\Facades\Http;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    Http::preventStrayRequests();
});

function merge(): CartMergeService
{
    return app(CartMergeService::class);
}

// ===========================================================================
// Happy path
// ===========================================================================

it('copies guest cart items into the authenticated user cart', function () {
    $user      = User::factory()->create();
    $guestCart = Cart::factory()->create(['version' => 1]);
    $product   = makePurchasableProduct(['stock_quantity' => 10]);

    CartItem::factory()->create([
        'cart_id'    => $guestCart->id,
        'product_id' => $product->id,
        'quantity'   => 3,
    ]);

    merge()->merge($user->id, $guestCart->guest_token);

    $userCart = Cart::where('user_id', $user->id)->with('items')->first();

    expect($userCart->items)->toHaveCount(1)
        ->and($userCart->items->first()->quantity)->toBe(3);
});

it('marks the guest cart as converted after merge', function () {
    $user      = User::factory()->create();
    $guestCart = Cart::factory()->create();
    $product   = makePurchasableProduct();

    CartItem::factory()->create(['cart_id' => $guestCart->id, 'product_id' => $product->id]);

    merge()->merge($user->id, $guestCart->guest_token);

    expect($guestCart->fresh()->status)->toBe('converted');
});

it('bumps the user cart version after merge', function () {
    $user      = User::factory()->create();
    $userCart  = Cart::factory()->forUser($user)->create(['version' => 1]);
    $guestCart = Cart::factory()->create();
    $product   = makePurchasableProduct();

    CartItem::factory()->create(['cart_id' => $guestCart->id, 'product_id' => $product->id]);

    merge()->merge($user->id, $guestCart->guest_token);

    expect($userCart->fresh()->version)->toBeGreaterThan(1);
});

// ===========================================================================
// Price integrity — never trust the guest snapshot
// ===========================================================================

it('recalculates price_at_addition from the current product, ignoring stale guest snapshot', function () {
    $user      = User::factory()->create();
    $guestCart = Cart::factory()->create();
    $product   = makePurchasableProduct(); // real price_toman = 1_500_000

    CartItem::factory()->create([
        'cart_id'           => $guestCart->id,
        'product_id'        => $product->id,
        'price_at_addition' => 1, // manipulated / stale snapshot
        'quantity'          => 1,
    ]);

    merge()->merge($user->id, $guestCart->guest_token);

    $userCart = Cart::where('user_id', $user->id)->with('items')->first();

    expect($userCart->items->first()->price_at_addition)->toBe(1_500_000); // real value
});

// ===========================================================================
// Idempotency
// ===========================================================================

it('is idempotent: calling merge twice with the same token does not duplicate items', function () {
    $user      = User::factory()->create();
    $guestCart = Cart::factory()->create();
    $product   = makePurchasableProduct();

    CartItem::factory()->create(['cart_id' => $guestCart->id, 'product_id' => $product->id, 'quantity' => 2]);

    merge()->merge($user->id, $guestCart->guest_token);
    merge()->merge($user->id, $guestCart->guest_token); // second call is a no-op

    $userCart = Cart::where('user_id', $user->id)->with('items')->first();

    expect($userCart->items)->toHaveCount(1)
        ->and($userCart->items->first()->quantity)->toBe(2); // not 4
});

// ===========================================================================
// Quantity caps
// ===========================================================================

it('caps merged quantity at MAX_QUANTITY_PER_ITEM (20) when combining existing + guest', function () {
    $user    = User::factory()->create();
    $product = makePurchasableProduct(['stock_quantity' => 100]);

    // User already has 15 in their cart.
    $userCart = Cart::factory()->forUser($user)->create();
    CartItem::factory()->create(['cart_id' => $userCart->id, 'product_id' => $product->id, 'quantity' => 15]);

    // Guest has 10 more of the same product.
    $guestCart = Cart::factory()->create();
    CartItem::factory()->create(['cart_id' => $guestCart->id, 'product_id' => $product->id, 'quantity' => 10]);

    merge()->merge($user->id, $guestCart->guest_token);

    $merged = CartItem::where('cart_id', $userCart->id)->first();
    expect($merged->quantity)->toBe(20); // capped, not 25
});

it('caps merged quantity at available stock when stock is lower than MAX', function () {
    $user    = User::factory()->create();
    $product = makePurchasableProduct(['stock_quantity' => 3]);

    $guestCart = Cart::factory()->create();
    CartItem::factory()->create(['cart_id' => $guestCart->id, 'product_id' => $product->id, 'quantity' => 10]);

    merge()->merge($user->id, $guestCart->guest_token);

    $userCart = Cart::where('user_id', $user->id)->with('items')->first();
    expect($userCart->items->first()->quantity)->toBe(3); // capped by stock
});

// ===========================================================================
// Edge cases
// ===========================================================================

it('skips inactive products during merge (does not add them to user cart)', function () {
    $user      = User::factory()->create();
    $guestCart = Cart::factory()->create();
    $product   = makePurchasableProduct(['is_active' => false]);

    CartItem::factory()->create(['cart_id' => $guestCart->id, 'product_id' => $product->id]);

    merge()->merge($user->id, $guestCart->guest_token);

    $userCart = Cart::where('user_id', $user->id)->first();
    expect($userCart?->items()->count() ?? 0)->toBe(0);
});

it('does nothing when guest token is unknown or already converted', function () {
    $user = User::factory()->create();

    merge()->merge($user->id, 'non-existent-token');

    // No cart created for user (merge returned early before firstOrCreate).
    expect(Cart::where('user_id', $user->id)->exists())->toBeFalse();
});

it('does nothing when guest cart status is already converted', function () {
    $user      = User::factory()->create();
    $guestCart = Cart::factory()->converted()->create();
    $product   = makePurchasableProduct();

    CartItem::factory()->create(['cart_id' => $guestCart->id, 'product_id' => $product->id]);

    merge()->merge($user->id, $guestCart->guest_token);

    // Status filter ('active') means the converted cart is not found → no-op.
    expect(Cart::where('user_id', $user->id)->exists())->toBeFalse();
});

it('preserves existing user cart items that are not in the guest cart', function () {
    $user      = User::factory()->create();
    $userCart  = Cart::factory()->forUser($user)->create();
    $productA  = makePurchasableProduct(['stock_quantity' => 10]);
    $productB  = makePurchasableProduct(['stock_quantity' => 10]);

    // User already has product A.
    CartItem::factory()->create(['cart_id' => $userCart->id, 'product_id' => $productA->id, 'quantity' => 2]);

    // Guest has product B.
    $guestCart = Cart::factory()->create();
    CartItem::factory()->create(['cart_id' => $guestCart->id, 'product_id' => $productB->id, 'quantity' => 1]);

    merge()->merge($user->id, $guestCart->guest_token);

    $items = $userCart->fresh()->items;
    expect($items)->toHaveCount(2); // both products present
});
