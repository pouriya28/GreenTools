<?php

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;

it('does not create a duplicate order on repeated checkout calls with unchanged cart', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create(['is_active' => true, 'stock_quantity' => 10, 'price_toman' => 100000]);

    $cart = Cart::factory()->create(['user_id' => $user->id, 'version' => 1]);
    CartItem::factory()->create(['cart_id' => $cart->id, 'product_id' => $product->id, 'quantity' => 2]);

    $this->actingAs($user);

    $first = $this->postJson('/api/v1/checkout')->assertCreated();
    $second = $this->postJson('/api/v1/checkout')->assertCreated();

    expect(Order::count())->toBe(1);
    expect($first->json('order_id'))->toBe($second->json('order_id'));
});