<?php

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;

it('rejects checkout when active reservations already hold the remaining stock', function () {
    $product = Product::factory()->create(['stock_quantity' => 1, 'is_active' => true]);
    InventoryReservation::factory()->create(['product_id' => $product->id, 'quantity' => 1]);

    $user = User::factory()->create();
    $cart = Cart::factory()->forUser($user)->create();
    CartItem::factory()->create(['cart_id' => $cart->id, 'product_id' => $product->id, 'quantity' => 1]);

    $this->actingAs($user)
        ->postJson('/api/v1/checkout')
        ->assertStatus(422)
        ->assertJsonPath('code', 'INSUFFICIENT_STOCK');
});

it('cancels the pending order and releases stock when a reservation expires', function () {
    $order = Order::factory()->create(['status' => \App\Enums\OrderStatus::PendingPayment]);
    InventoryReservation::factory()->pastExpiry()->create(['order_id' => $order->id]);

    (new \App\Jobs\ExpireInventoryReservationsJob())->handle();

    expect($order->refresh()->status)->toBe(\App\Enums\OrderStatus::Cancelled);
});