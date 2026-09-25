<?php

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Http;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    Http::preventStrayRequests();
});

// ---------------------------------------------------------------------------
// Helpers (local to this file)
// ---------------------------------------------------------------------------

function ownershipProduct(): Product
{
    return makePurchasableProduct();
}

function ownerCartWithItem(User $owner): array
{
    $cart    = Cart::factory()->forUser($owner)->create(['version' => 1]);
    $product = ownershipProduct();
    $item    = CartItem::factory()->create(['cart_id' => $cart->id, 'product_id' => $product->id]);

    return [$cart, $item];
}

// ===========================================================================
// IDOR — Authenticated user vs another user's items
// ===========================================================================

it('returns 404 (not 403) when user A tries to PATCH user B item — no enumeration', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    [, $itemB] = ownerCartWithItem($userB);

    $this->actingAs($userA, 'sanctum')
         ->patchJson("/api/v1/cart/items/{$itemB->id}", ['quantity' => 1, 'version' => 1])
         ->assertNotFound()
         ->assertJsonPath('error_code', 'CART_ITEM_NOT_FOUND');
});

it('returns 404 (not 403) when user A tries to DELETE user B item — no enumeration', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    [, $itemB] = ownerCartWithItem($userB);

    $this->actingAs($userA, 'sanctum')
         ->deleteJson("/api/v1/cart/items/{$itemB->id}?version=1")
         ->assertNotFound()
         ->assertJsonPath('error_code', 'CART_ITEM_NOT_FOUND');
});

it('response for another user item is identical to response for a non-existent item id', function () {
    // Enumeration protection: attacker must not be able to distinguish
    // "item exists but belongs to someone else" from "item does not exist".
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    [, $itemB] = ownerCartWithItem($userB);

    $responseExisting    = $this->actingAs($userA, 'sanctum')
        ->patchJson("/api/v1/cart/items/{$itemB->id}", ['quantity' => 1, 'version' => 1]);

    $responseNonExistent = $this->actingAs($userA, 'sanctum')
        ->patchJson('/api/v1/cart/items/99999', ['quantity' => 1, 'version' => 1]);

    $responseExisting->assertNotFound();
    $responseNonExistent->assertNotFound();

    expect($responseExisting->json('error_code'))
        ->toBe($responseNonExistent->json('error_code'));
});

it('does not allow user A to modify user B cart through any route parameter trick', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    [$cartB, $itemB] = ownerCartWithItem($userB);
    $versionBefore = $cartB->version;

    $this->actingAs($userA, 'sanctum')
         ->patchJson("/api/v1/cart/items/{$itemB->id}", ['quantity' => 9, 'version' => 1]);

    // Item quantity must remain unchanged.
    expect($itemB->fresh()->quantity)->not->toBe(9);
    // Cart B version must remain unchanged.
    expect($cartB->fresh()->version)->toBe($versionBefore);
});

// ===========================================================================
// IDOR — Guest cart isolation
// ===========================================================================

it('guest A cannot PATCH an item from guest B cart', function () {
    $cartA   = Cart::factory()->create();
    $cartB   = Cart::factory()->create();
    $product = ownershipProduct();
    $itemB   = CartItem::factory()->create(['cart_id' => $cartB->id, 'product_id' => $product->id]);

    $this->withUnencryptedCookie('cart_guest_token', $cartA->guest_token)
         ->patchJson("/api/v1/cart/items/{$itemB->id}", ['quantity' => 1, 'version' => 1])
         ->assertNotFound();
});

it('guest cannot PATCH an authenticated user cart item', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create();
    $product = ownershipProduct();
    $item    = CartItem::factory()->create(['cart_id' => $cart->id, 'product_id' => $product->id]);

    $guestCart = Cart::factory()->create();

    $this->withUnencryptedCookie('cart_guest_token', $guestCart->guest_token)
         ->patchJson("/api/v1/cart/items/{$item->id}", ['quantity' => 1, 'version' => 1])
         ->assertNotFound();
});

it('guest cannot DELETE an item from another guest cart', function () {
    $cartA   = Cart::factory()->create();
    $cartB   = Cart::factory()->create(['version' => 1]);
    $product = ownershipProduct();
    $itemB   = CartItem::factory()->create(['cart_id' => $cartB->id, 'product_id' => $product->id]);

    $this->withUnencryptedCookie('cart_guest_token', $cartA->guest_token)
         ->deleteJson("/api/v1/cart/items/{$itemB->id}?version=1")
         ->assertNotFound();
});

// ===========================================================================
// Mass assignment — client must never set cart_id, user_id, or price
// ===========================================================================

it('ignores client-supplied cart_id in addItem body — item goes to own cart only', function () {
    $userA   = User::factory()->create();
    $userB   = User::factory()->create();
    $cartB   = Cart::factory()->forUser($userB)->create();
    $product = ownershipProduct();

    $this->actingAs($userA, 'sanctum')
         ->postJson('/api/v1/cart/items', [
             'cart_id'    => $cartB->id, // injection attempt
             'product_id' => $product->id,
             'quantity'   => 1,
         ])
         ->assertSuccessful();

    // User B's cart must remain empty.
    expect($cartB->fresh()->items()->count())->toBe(0);
});

it('ignores client-supplied user_id in addItem body', function () {
    $userA   = User::factory()->create();
    $userB   = User::factory()->create();
    $product = ownershipProduct();

    $this->actingAs($userA, 'sanctum')
         ->postJson('/api/v1/cart/items', [
             'user_id'    => $userB->id, // injection attempt
             'product_id' => $product->id,
             'quantity'   => 1,
         ])
         ->assertSuccessful();

    // Item must belong to User A's cart.
    $item = CartItem::whereHas('cart', fn ($q) => $q->where('user_id', $userA->id))->first();
    expect($item)->not->toBeNull();

    // User B must have no items.
    expect(CartItem::whereHas('cart', fn ($q) => $q->where('user_id', $userB->id))->count())->toBe(0);
});

// ===========================================================================
// Converted / invalid guest token
// ===========================================================================

it('creates a fresh cart when guest_token belongs to a converted cart', function () {
    $convertedCart = Cart::factory()->converted()->create();

    // Reusing a converted token must not return that old cart.
    $response = $this->withUnencryptedCookie('cart_guest_token', $convertedCart->guest_token)
                     ->getJson('/api/v1/cart');

    $response->assertSuccessful();
    expect($response->json('data.id'))->not->toBe($convertedCart->id);
});

it('creates a fresh cart when guest_token is tampered / unknown', function () {
    $response = $this->withUnencryptedCookie('cart_guest_token', 'totally-fake-token')
                     ->getJson('/api/v1/cart');

    $response->assertSuccessful();

    // Must be a brand new cart (no items, version 1).
    $id   = $response->json('data.id');
    $cart = Cart::find($id);
    expect($cart)->not->toBeNull()
        ->and($cart->version)->toBe(1)
        ->and($cart->items()->count())->toBe(0);
});
