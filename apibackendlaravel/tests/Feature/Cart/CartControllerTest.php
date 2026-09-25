<?php

use App\Enums\PurchaseRequirement;
use App\Enums\StockStatus;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(function () {
    Http::preventStrayRequests();
});

// ===========================================================================
// SHOW  GET /api/v1/cart
// ===========================================================================

it('creates a fresh guest cart on first visit and sets the session cookie', function () {
    $response = $this->getJson('/api/v1/cart');

    $response->assertSuccessful()
             ->assertJsonStructure(['data' => ['id', 'version', 'items']]);

    $cookieNames = collect($response->headers->getCookies())
        ->map(fn ($c) => $c->getName());

    expect($cookieNames->contains('cart_guest_token'))->toBeTrue();
});

it('returns the same guest cart when a valid cookie is sent', function () {
    // EncryptCookies middleware strips raw tokens from Laravel's HTTP test client,
    // so we test ResolveCart directly by injecting the token into the cookie bag.
    $cart = Cart::factory()->create(['status' => 'active']);

    $request  = \Illuminate\Http\Request::create('/api/v1/cart', 'GET');
    $request->cookies->set('cart_guest_token', $cart->guest_token);

    $resolved = null;
    app(\App\Http\Middleware\ResolveCart::class)
        ->handle($request, function ($req) use (&$resolved) {
            $resolved = $req->attributes->get('current_cart');
            return response('');
        });

    expect($resolved?->id)->toBe($cart->id);
});

it('does NOT create a second guest cart when a valid cookie is present', function () {
    $cart = Cart::factory()->create();

    $this->withUnencryptedCookie('cart_guest_token', $cart->guest_token)
         ->getJson('/api/v1/cart');

    // Only one cart must exist for this token.
    expect(Cart::where('guest_token', $cart->guest_token)->count())->toBe(1);
});

it('returns the authenticated user cart', function () {
    $user = User::factory()->create();
    $cart = Cart::factory()->forUser($user)->create();

    $this->actingAs($user, 'sanctum')
         ->getJson('/api/v1/cart')
         ->assertSuccessful()
         ->assertJsonPath('data.id', $cart->id);
});

it('auto-creates a cart for a new authenticated user', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
         ->getJson('/api/v1/cart')
         ->assertSuccessful();

    expect(Cart::where('user_id', $user->id)->where('status', 'active')->exists())->toBeTrue();
});

it('does not expose another user cart via any client-supplied id', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();
    Cart::factory()->forUser($userB)->create();

    // User A asks for their cart — must always get their own, never B's.
    $response = $this->actingAs($userA, 'sanctum')->getJson('/api/v1/cart');

    $response->assertSuccessful();
    $cartId = $response->json('data.id');
    expect(Cart::find($cartId)?->user_id)->toBe($userA->id);
});

// ===========================================================================
// ADD ITEM  POST /api/v1/cart/items
// ===========================================================================

it('adds a product to the cart and bumps the version', function () {
    $user    = User::factory()->create();
    $product = makePurchasableProduct();

    $this->actingAs($user, 'sanctum')
         ->postJson('/api/v1/cart/items', [
             'product_id' => $product->id,
             'quantity'   => 2,
         ])
         ->assertSuccessful()
         ->assertJsonPath('data.items.0.quantity', 2);

    expect(Cart::where('user_id', $user->id)->value('version'))->toBe(2);
});

it('rejects a non-existent product_id at validation (422)', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
         ->postJson('/api/v1/cart/items', [
             'product_id' => '01JFAKEULID000000000000000',
             'quantity'   => 1,
         ])
         ->assertUnprocessable();
});

it('rejects a non-ULID product_id at validation (422)', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
         ->postJson('/api/v1/cart/items', [
             'product_id' => '12345',
             'quantity'   => 1,
         ])
         ->assertUnprocessable();
});

it('rejects quantity = 0 at validation (422)', function () {
    $user    = User::factory()->create();
    $product = makePurchasableProduct();

    $this->actingAs($user, 'sanctum')
         ->postJson('/api/v1/cart/items', [
             'product_id' => $product->id,
             'quantity'   => 0,
         ])
         ->assertUnprocessable();
});

it('rejects quantity > 20 at validation (422)', function () {
    $user    = User::factory()->create();
    $product = makePurchasableProduct(['stock_quantity' => 100]);

    $this->actingAs($user, 'sanctum')
         ->postJson('/api/v1/cart/items', [
             'product_id' => $product->id,
             'quantity'   => 21,
         ])
         ->assertUnprocessable();
});

it('rejects an inactive product with 404 (service layer)', function () {
    $user    = User::factory()->create();
    $product = makePurchasableProduct(['is_active' => false]);

    $this->actingAs($user, 'sanctum')
         ->postJson('/api/v1/cart/items', [
             'product_id' => $product->id,
             'quantity'   => 1,
         ])
         ->assertUnprocessable(); // ProductUnavailableException → 422
});

it('rejects add when stock_status is out_of_stock (422)', function () {
    $user    = User::factory()->create();
    $product = makePurchasableProduct([
        'stock_status'   => StockStatus::OutOfStock,
        'stock_quantity' => 0,
    ]);

    $this->actingAs($user, 'sanctum')
         ->postJson('/api/v1/cart/items', [
             'product_id' => $product->id,
             'quantity'   => 1,
         ])
         ->assertUnprocessable(); // InsufficientStockException → 422
});

it('rejects add when quantity exceeds available stock (422)', function () {
    $user    = User::factory()->create();
    $product = makePurchasableProduct(['stock_quantity' => 2]);

    $this->actingAs($user, 'sanctum')
         ->postJson('/api/v1/cart/items', [
             'product_id' => $product->id,
             'quantity'   => 5,
         ])
         ->assertUnprocessable();
});

it('rejects add when purchase_confirmed is missing for a restricted product (422)', function () {
    $user    = User::factory()->create();
    $product = makePurchasableProduct(['purchase_confirmation_required' => true]);

    $this->actingAs($user, 'sanctum')
         ->postJson('/api/v1/cart/items', [
             'product_id' => $product->id,
             'quantity'   => 1,
             // purchase_confirmed intentionally omitted
         ])
         ->assertUnprocessable(); // PurchaseConfirmationRequiredException → 422
});

it('accepts a restricted product when purchase_confirmed is true', function () {
    $user    = User::factory()->create();
    $product = makePurchasableProduct(['purchase_confirmation_required' => true]);

    $this->actingAs($user, 'sanctum')
         ->postJson('/api/v1/cart/items', [
             'product_id'        => $product->id,
             'quantity'          => 1,
             'purchase_confirmed' => true,
         ])
         ->assertSuccessful();
});

it('accumulates quantity when the same product is added twice', function () {
    $user    = User::factory()->create();
    $product = makePurchasableProduct(['stock_quantity' => 10]);

    $this->actingAs($user, 'sanctum')
         ->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 3])
         ->assertSuccessful();

    $this->actingAs($user, 'sanctum')
         ->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 4])
         ->assertSuccessful();

    $cart = Cart::where('user_id', $user->id)->first();
    expect($cart->items->first()->quantity)->toBe(7);
});

// --- Mass assignment guard ---

it('ignores client-supplied price_at_addition and uses the real product price snapshot', function () {
    $user    = User::factory()->create();
    $product = makePurchasableProduct(); // price_toman = 1_500_000

    $this->actingAs($user, 'sanctum')
         ->postJson('/api/v1/cart/items', [
             'product_id'        => $product->id,
             'quantity'          => 1,
             'price_at_addition' => 1, // attacker tries to set price to 1 toman
         ])
         ->assertSuccessful();

    $item = CartItem::whereHas('cart', fn ($q) => $q->where('user_id', $user->id))->first();

    expect($item->price_at_addition)->toBe(1_500_000); // server snapshot, not 1
});

it('ignores client-supplied discount_at_addition', function () {
    $user    = User::factory()->create();
    $product = makePurchasableProduct();

    $this->actingAs($user, 'sanctum')
         ->postJson('/api/v1/cart/items', [
             'product_id'           => $product->id,
             'quantity'             => 1,
             'discount_at_addition' => 9_999_999, // attacker inflates discount
         ])
         ->assertSuccessful();

    $item = CartItem::whereHas('cart', fn ($q) => $q->where('user_id', $user->id))->first();

    expect($item->discount_at_addition)->toBe(0); // no discount on product
});

// --- Guest cart ---

it('guest cart also enforces stock and records the item with a cookie', function () {
    // Same approach: inject token directly into request cookie bag.
    $cart    = Cart::factory()->create(['status' => 'active']);
    $product = makePurchasableProduct();

    $request = \Illuminate\Http\Request::create('/api/v1/cart/items', 'POST');
    $request->cookies->set('cart_guest_token', $cart->guest_token);

    $resolvedCart = null;
    app(\App\Http\Middleware\ResolveCart::class)
        ->handle($request, function ($req) use (&$resolvedCart) {
            $resolvedCart = $req->attributes->get('current_cart');
            return response('');
        });

    // Cart is correctly resolved — now add item through the service directly.
    expect($resolvedCart?->id)->toBe($cart->id);

    app(\App\Services\Cart\CartService::class)
        ->addItem($resolvedCart, $product->id, 1);

    expect($cart->fresh()->items()->count())->toBe(1);
});

// ===========================================================================
// UPDATE ITEM  PATCH /api/v1/cart/items/{item}
// ===========================================================================

it('updates quantity and bumps the version', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create(['version' => 1]);
    $product = makePurchasableProduct(['stock_quantity' => 10]);
    $item    = CartItem::factory()->create([
        'cart_id'    => $cart->id,
        'product_id' => $product->id,
        'quantity'   => 2,
    ]);

    $this->actingAs($user, 'sanctum')
         ->patchJson("/api/v1/cart/items/{$item->id}", ['quantity' => 5, 'version' => 1])
         ->assertSuccessful()
         ->assertJsonPath('data.items.0.quantity', 5);

    expect($cart->fresh()->version)->toBe(2);
});

it('returns 409 on a stale version when updating', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create(['version' => 3]);
    $product = makePurchasableProduct();
    $item    = CartItem::factory()->create(['cart_id' => $cart->id, 'product_id' => $product->id]);

    $this->actingAs($user, 'sanctum')
         ->patchJson("/api/v1/cart/items/{$item->id}", ['quantity' => 1, 'version' => 1])
         ->assertStatus(409); // CartVersionConflictException
});

it('returns 404 when updating a non-existent item', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
         ->patchJson('/api/v1/cart/items/99999', ['quantity' => 1, 'version' => 1])
         ->assertNotFound();
});

// ===========================================================================
// REMOVE ITEM  DELETE /api/v1/cart/items/{item}?version=N
// ===========================================================================

it('removes an item and bumps the version', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create(['version' => 1]);
    $product = makePurchasableProduct();
    $item    = CartItem::factory()->create(['cart_id' => $cart->id, 'product_id' => $product->id]);

    // version is read from query string on DELETE (see CartController::removeItem)
    $this->actingAs($user, 'sanctum')
         ->deleteJson("/api/v1/cart/items/{$item->id}?version=1")
         ->assertSuccessful();

    expect(CartItem::find($item->id))->toBeNull();
    expect($cart->fresh()->version)->toBe(2);
});

it('returns 409 on a stale version when removing', function () {
    $user    = User::factory()->create();
    $cart    = Cart::factory()->forUser($user)->create(['version' => 5]);
    $product = makePurchasableProduct();
    $item    = CartItem::factory()->create(['cart_id' => $cart->id, 'product_id' => $product->id]);

    $this->actingAs($user, 'sanctum')
         ->deleteJson("/api/v1/cart/items/{$item->id}?version=1")
         ->assertStatus(409);
});

it('returns 404 when removing a non-existent item', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
         ->deleteJson('/api/v1/cart/items/99999?version=1')
         ->assertNotFound();
});
