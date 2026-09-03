<?php

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;

it('does not create a duplicate order when checkout is called twice with the same cart version', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create(['stock_quantity' => 5, 'is_active' => true]);
    $cart = Cart::factory()->forUser($user)->create();
    CartItem::factory()->create(['cart_id' => $cart->id, 'product_id' => $product->id, 'quantity' => 1]);

    $this->actingAs($user)->postJson('/api/v1/checkout')->assertCreated();
    $this->actingAs($user)->postJson('/api/v1/checkout')->assertCreated();

    expect(\App\Models\Order::where('user_id', $user->id)->count())->toBe(1);
});

it('rejects checkout on an empty cart', function () {
    $user = User::factory()->create();
    Cart::factory()->forUser($user)->create();

    $this->actingAs($user)
        ->postJson('/api/v1/checkout')
        ->assertStatus(422)
        ->assertJsonPath('code', 'CHECKOUT_VALIDATION_FAILED');
});