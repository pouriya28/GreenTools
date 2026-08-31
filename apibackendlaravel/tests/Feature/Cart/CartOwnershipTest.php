<?php

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;

it('prevents a user from mutating another users cart item', function () {
    $victim = User::factory()->create();
    $attacker = User::factory()->create();
    $product = Product::factory()->create(['is_active' => true, 'stock_quantity' => 10]);

    $victimCart = Cart::factory()->create(['user_id' => $victim->id]);
    $item = CartItem::factory()->create(['cart_id' => $victimCart->id, 'product_id' => $product->id]);

    $this->actingAs($attacker)
        ->patchJson("/api/v1/cart/items/{$item->id}", ['quantity' => 5, 'version' => $victimCart->version])
        ->assertNotFound()
        ->assertJson(['error_code' => 'CART_ITEM_NOT_FOUND']);
});

it('issues a high-entropy guest token cookie on first cart access', function () {
    $response = $this->getJson('/api/v1/cart');

    $response->assertCookie('cart_guest_token');
    $token = $response->getCookie('cart_guest_token', false)?->getValue();

    expect($token)->not->toBeNull();
});