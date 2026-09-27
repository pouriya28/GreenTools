<?php

use App\Models\Product;
use App\Models\User;
use App\Models\Wishlist;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    Http::preventStrayRequests();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wProduct(): Product
{
    return Product::factory()->create();
}

function wUser(): User
{
    return User::factory()->create();
}

function guestToken(): string
{
    return bin2hex(random_bytes(32));
}

function withGuestWishlistToken(string $token): \Illuminate\Testing\TestResponse
{
    // Expose helper for chaining — actual usage: $this->withUnencryptedCookie(...)
    return app(\Illuminate\Foundation\Testing\TestCase::class);
}

// ---------------------------------------------------------------------------
// INDEX — GET /api/v1/wishlist
// ---------------------------------------------------------------------------

describe('WishlistController::index — authenticated', function () {

    it('authenticated user can see their wishlist products', function () {
        $user     = wUser();
        $product1 = wProduct();
        $product2 = wProduct();

        Wishlist::create(['user_id' => $user->id, 'product_id' => $product1->id]);
        Wishlist::create(['user_id' => $user->id, 'product_id' => $product2->id]);

        $this->actingAs($user)->getJson('/api/v1/wishlist')
            ->assertOk();
    });

    it('authenticated user cannot see another user wishlist (IDOR)', function () {
        $owner = wUser();
        $other = wUser();
        $product = wProduct();

        Wishlist::create(['user_id' => $owner->id, 'product_id' => $product->id]);

        $response = $this->actingAs($other)->getJson('/api/v1/wishlist')->assertOk();

        // Other user's wishlist is empty — owner's product not visible
        $ids = collect($response->json('data.data') ?? [])->pluck('id');
        expect($ids)->not->toContain($product->id);
    });

    it('empty wishlist returns empty list', function () {
        $user = wUser();

        $response = $this->actingAs($user)->getJson('/api/v1/wishlist')->assertOk();

        expect($response->json('data.data'))->toBeEmpty();
    });

});

describe('WishlistController::index — guest', function () {

    it('guest can see their wishlist via token cookie', function () {
        $token   = guestToken();
        $product = wProduct();

        Wishlist::create([
            'guest_token' => $token,
            'product_id'  => $product->id,
            'expires_at'  => now()->addDays(10),
        ]);

        $this->withUnencryptedCookie('wishlist_guest_token', $token)
            ->withCredentials()
            ->getJson('/api/v1/wishlist')
            ->assertOk();
    });

    it('guest cannot see another guest wishlist', function () {
        $token1  = guestToken();
        $token2  = guestToken();
        $product = wProduct();

        Wishlist::create([
            'guest_token' => $token1,
            'product_id'  => $product->id,
            'expires_at'  => now()->addDays(10),
        ]);

        $response = $this->withUnencryptedCookie('wishlist_guest_token', $token2)
            ->withCredentials()
            ->getJson('/api/v1/wishlist')
            ->assertOk();

        expect($response->json('data.data'))->toBeEmpty();
    });

    it('expired guest wishlist items are not returned', function () {
        $token   = guestToken();
        $product = wProduct();

        Wishlist::create([
            'guest_token' => $token,
            'product_id'  => $product->id,
            'expires_at'  => now()->subDay(), // expired
        ]);

        $response = $this->withUnencryptedCookie('wishlist_guest_token', $token)
            ->withCredentials()
            ->getJson('/api/v1/wishlist')
            ->assertOk();

        expect($response->json('data.data'))->toBeEmpty();
    });

});

// ---------------------------------------------------------------------------
// PRODUCT IDS — GET /api/v1/wishlist/product-ids
// ---------------------------------------------------------------------------

describe('WishlistController::productIds', function () {

    it('returns product ids for authenticated user', function () {
        $user    = wUser();
        $product = wProduct();
        Wishlist::create(['user_id' => $user->id, 'product_id' => $product->id]);

        $response = $this->actingAs($user)->getJson('/api/v1/wishlist/product-ids')->assertOk();

        expect($response->json('data.product_ids'))->toContain($product->id);
    });

    it('does not return other user product ids (IDOR)', function () {
        $owner   = wUser();
        $other   = wUser();
        $product = wProduct();
        Wishlist::create(['user_id' => $owner->id, 'product_id' => $product->id]);

        $response = $this->actingAs($other)->getJson('/api/v1/wishlist/product-ids')->assertOk();

        expect($response->json('data.product_ids'))->not->toContain($product->id);
    });

    it('returns product ids for guest via token', function () {
        $token   = guestToken();
        $product = wProduct();
        Wishlist::create([
            'guest_token' => $token,
            'product_id'  => $product->id,
            'expires_at'  => now()->addDays(10),
        ]);

        $response = $this->withUnencryptedCookie('wishlist_guest_token', $token)
            ->withCredentials()
            ->getJson('/api/v1/wishlist/product-ids')
            ->assertOk();

        expect($response->json('data.product_ids'))->toContain($product->id);
    });

});

// ---------------------------------------------------------------------------
// STORE — POST /api/v1/wishlist
// ---------------------------------------------------------------------------

describe('WishlistController::store — authenticated', function () {

    it('authenticated user can add a product to wishlist', function () {
        $user    = wUser();
        $product = wProduct();

        $this->actingAs($user)->postJson('/api/v1/wishlist', [
            'product_id' => $product->id,
        ])->assertCreated();

        $this->assertDatabaseHas('wishlists', [
            'user_id'    => $user->id,
            'product_id' => $product->id,
        ]);
    });

    it('adding same product twice is idempotent (no error)', function () {
        $user    = wUser();
        $product = wProduct();

        $this->actingAs($user)->postJson('/api/v1/wishlist', [
            'product_id' => $product->id,
        ])->assertCreated();

        $this->actingAs($user)->postJson('/api/v1/wishlist', [
            'product_id' => $product->id,
        ])->assertCreated();

        expect(Wishlist::where('user_id', $user->id)->where('product_id', $product->id)->count())->toBe(1);
    });

    it('requires product_id', function () {
        $user = wUser();

        $this->actingAs($user)->postJson('/api/v1/wishlist', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['product_id']);
    });

    it('rejects non-existent product_id', function () {
        $user = wUser();

        $this->actingAs($user)->postJson('/api/v1/wishlist', [
            'product_id' => Str::ulid(),
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['product_id']);
    });

    it('user_id is taken from auth, not from request body', function () {
        $user    = wUser();
        $victim  = wUser();
        $product = wProduct();

        // Even if attacker sends victim's user_id in body, it is ignored
        $this->actingAs($user)->postJson('/api/v1/wishlist', [
            'product_id' => $product->id,
            'user_id'    => $victim->id, // should be ignored
        ])->assertCreated();

        $this->assertDatabaseHas('wishlists', [
            'user_id'    => $user->id,
            'product_id' => $product->id,
        ]);
        $this->assertDatabaseMissing('wishlists', [
            'user_id'    => $victim->id,
            'product_id' => $product->id,
        ]);
    });

});

describe('WishlistController::store — guest', function () {

    it('guest can add a product to wishlist', function () {
        $token   = guestToken();
        $product = wProduct();

        $this->withUnencryptedCookie('wishlist_guest_token', $token)
            ->withCredentials()
            ->postJson('/api/v1/wishlist', ['product_id' => $product->id])
            ->assertCreated();

        $this->assertDatabaseHas('wishlists', [
            'guest_token' => $token,
            'product_id'  => $product->id,
        ]);
    });

    it('guest wishlist item has expires_at set to 10 days', function () {
        $token   = guestToken();
        $product = wProduct();

        $this->withUnencryptedCookie('wishlist_guest_token', $token)
            ->withCredentials()
            ->postJson('/api/v1/wishlist', ['product_id' => $product->id])
            ->assertCreated();

        $item = Wishlist::where('guest_token', $token)->first();
        expect($item->expires_at)->not->toBeNull();
        expect(\Carbon\Carbon::parse($item->expires_at)->diffInDays(now()))->toBeLessThanOrEqual(10);
    });

    it('guest adding same product twice is idempotent', function () {
        $token   = guestToken();
        $product = wProduct();

        $this->withUnencryptedCookie('wishlist_guest_token', $token)
            ->withCredentials()
            ->postJson('/api/v1/wishlist', ['product_id' => $product->id])
            ->assertCreated();

        $this->withUnencryptedCookie('wishlist_guest_token', $token)
            ->withCredentials()
            ->postJson('/api/v1/wishlist', ['product_id' => $product->id])
            ->assertCreated();

        expect(Wishlist::where('guest_token', $token)->where('product_id', $product->id)->count())->toBe(1);
    });

    it('new guest gets a wishlist_guest_token cookie on first request', function () {
        $product = wProduct();

        $response = $this->postJson('/api/v1/wishlist', ['product_id' => $product->id])
            ->assertCreated();

        expect($response->headers->getCookies())->not->toBeEmpty();
        $cookieNames = array_map(fn($c) => $c->getName(), $response->headers->getCookies());
        expect($cookieNames)->toContain('wishlist_guest_token');
    });

});

// ---------------------------------------------------------------------------
// DESTROY — DELETE /api/v1/wishlist/{product}
// ---------------------------------------------------------------------------

describe('WishlistController::destroy — authenticated', function () {

    it('authenticated user can remove a product from wishlist', function () {
        $user    = wUser();
        $product = wProduct();
        Wishlist::create(['user_id' => $user->id, 'product_id' => $product->id]);

        $this->actingAs($user)->deleteJson("/api/v1/wishlist/{$product->id}")
            ->assertOk();

        $this->assertDatabaseMissing('wishlists', [
            'user_id'    => $user->id,
            'product_id' => $product->id,
        ]);
    });

    it('user cannot remove another user wishlist item (IDOR)', function () {
        $owner   = wUser();
        $other   = wUser();
        $product = wProduct();
        Wishlist::create(['user_id' => $owner->id, 'product_id' => $product->id]);

        $this->actingAs($other)->deleteJson("/api/v1/wishlist/{$product->id}")
            ->assertOk(); // 200 but owner's item untouched

        $this->assertDatabaseHas('wishlists', [
            'user_id'    => $owner->id,
            'product_id' => $product->id,
        ]);
    });

    it('removing non-existent wishlist item returns ok (idempotent)', function () {
        $user    = wUser();
        $product = wProduct();

        $this->actingAs($user)->deleteJson("/api/v1/wishlist/{$product->id}")
            ->assertOk();
    });

});

describe('WishlistController::destroy — guest', function () {

    it('guest can remove their own wishlist item', function () {
        $token   = guestToken();
        $product = wProduct();
        Wishlist::create([
            'guest_token' => $token,
            'product_id'  => $product->id,
            'expires_at'  => now()->addDays(10),
        ]);

        $this->withUnencryptedCookie('wishlist_guest_token', $token)
            ->withCredentials()
            ->deleteJson("/api/v1/wishlist/{$product->id}")
            ->assertOk();

        $this->assertDatabaseMissing('wishlists', [
            'guest_token' => $token,
            'product_id'  => $product->id,
        ]);
    });

    it('guest cannot remove another guest wishlist item (IDOR)', function () {
        $token1  = guestToken();
        $token2  = guestToken();
        $product = wProduct();
        Wishlist::create([
            'guest_token' => $token1,
            'product_id'  => $product->id,
            'expires_at'  => now()->addDays(10),
        ]);

        $this->withUnencryptedCookie('wishlist_guest_token', $token2)
            ->withCredentials()
            ->deleteJson("/api/v1/wishlist/{$product->id}")
            ->assertOk();

        // token1's item must still be there
        $this->assertDatabaseHas('wishlists', [
            'guest_token' => $token1,
            'product_id'  => $product->id,
        ]);
    });

});

// ---------------------------------------------------------------------------
// MERGE — guest wishlist merged after login
// ---------------------------------------------------------------------------

describe('WishlistService::mergeGuestIntoUser', function () {

    it('guest products are moved to user wishlist after login', function () {
        $token   = guestToken();
        $user    = wUser();
        $product = wProduct();

        Wishlist::create([
            'guest_token' => $token,
            'product_id'  => $product->id,
            'expires_at'  => now()->addDays(10),
        ]);

        app(\App\Services\WishlistService::class)->mergeGuestIntoUser($token, $user->id);

        $this->assertDatabaseHas('wishlists', [
            'user_id'    => $user->id,
            'product_id' => $product->id,
        ]);
        $this->assertDatabaseMissing('wishlists', ['guest_token' => $token]);
    });

    it('merge is idempotent when product already in user wishlist', function () {
        $token   = guestToken();
        $user    = wUser();
        $product = wProduct();

        // Already in user wishlist
        Wishlist::create(['user_id' => $user->id, 'product_id' => $product->id]);

        // Also in guest wishlist
        Wishlist::create([
            'guest_token' => $token,
            'product_id'  => $product->id,
            'expires_at'  => now()->addDays(10),
        ]);

        // Should not throw, no duplicate
        app(\App\Services\WishlistService::class)->mergeGuestIntoUser($token, $user->id);

        expect(Wishlist::where('user_id', $user->id)->where('product_id', $product->id)->count())->toBe(1);
        $this->assertDatabaseMissing('wishlists', ['guest_token' => $token]);
    });

    it('expired guest items are not merged', function () {
        $token   = guestToken();
        $user    = wUser();
        $product = wProduct();

        Wishlist::create([
            'guest_token' => $token,
            'product_id'  => $product->id,
            'expires_at'  => now()->subDay(), // expired
        ]);

        app(\App\Services\WishlistService::class)->mergeGuestIntoUser($token, $user->id);

        $this->assertDatabaseMissing('wishlists', [
            'user_id'    => $user->id,
            'product_id' => $product->id,
        ]);
    });

    it('guest token cannot be used to merge into another user wishlist (no IDOR)', function () {
        $token   = guestToken();
        $owner   = wUser();
        $victim  = wUser();
        $product = wProduct();

        Wishlist::create([
            'guest_token' => $token,
            'product_id'  => $product->id,
            'expires_at'  => now()->addDays(10),
        ]);

        // Merge into owner's wishlist (legitimate)
        app(\App\Services\WishlistService::class)->mergeGuestIntoUser($token, $owner->id);

        // Victim's wishlist must be untouched
        $this->assertDatabaseMissing('wishlists', [
            'user_id'    => $victim->id,
            'product_id' => $product->id,
        ]);
    });

});

// ---------------------------------------------------------------------------
// CLEANUP
// ---------------------------------------------------------------------------

describe('WishlistService::deleteExpiredGuestWishlists', function () {

    it('deletes expired guest wishlist items', function () {
        $token   = guestToken();
        $product = wProduct();

        Wishlist::create([
            'guest_token' => $token,
            'product_id'  => $product->id,
            'expires_at'  => now()->subDay(),
        ]);

        $deleted = app(\App\Services\WishlistService::class)->deleteExpiredGuestWishlists();

        expect($deleted)->toBe(1);
        $this->assertDatabaseMissing('wishlists', ['guest_token' => $token]);
    });

    it('does not delete non-expired guest items', function () {
        $token   = guestToken();
        $product = wProduct();

        Wishlist::create([
            'guest_token' => $token,
            'product_id'  => $product->id,
            'expires_at'  => now()->addDays(5),
        ]);

        app(\App\Services\WishlistService::class)->deleteExpiredGuestWishlists();

        $this->assertDatabaseHas('wishlists', ['guest_token' => $token]);
    });

    it('does not delete authenticated user wishlist items', function () {
        $user    = wUser();
        $product = wProduct();

        Wishlist::create(['user_id' => $user->id, 'product_id' => $product->id]);

        app(\App\Services\WishlistService::class)->deleteExpiredGuestWishlists();

        $this->assertDatabaseHas('wishlists', ['user_id' => $user->id]);
    });

});
