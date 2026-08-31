<?php

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\InventoryReservation;
use App\Models\Product;
use App\Models\User;

it('rejects checkout when requested quantity exceeds available (non-reserved) stock', function () {
    $user = User::factory()->create();
    $otherOrder = \App\Models\Order::factory()->create(['status' => 'pending_payment']);
    $product = Product::factory()->create(['is_active' => true, 'stock_quantity' => 5]);

    // Another pending order already holds an active reservation on 4 of the 5 units.
    InventoryReservation::factory()->create([
        'order_id' => $otherOrder->id,
        'product_id' => $product->id,
        'quantity' => 4,
        'status' => 'active',
        'expires_at' => now()->addMinutes(20),
    ]);

    $cart = Cart::factory()->create(['user_id' => $user->id]);
    CartItem::factory()->create(['cart_id' => $cart->id, 'product_id' => $product->id, 'quantity' => 2]);

    $this->actingAs($user)
        ->postJson('/api/v1/checkout')
        ->assertStatus(422)
        ->assertJson(['error_code' => 'INSUFFICIENT_STOCK', 'available_stock' => 1]);
});

it('expires reservations and cancels the order after the reservation window passes', function () {
    $order = \App\Models\Order::factory()->create(['status' => 'pending_payment']);
    $product = Product::factory()->create(['stock_quantity' => 5]);

    InventoryReservation::factory()->create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'quantity' => 2,
        'status' => 'active',
        'expires_at' => now()->subMinute(),
    ]);

    \App\Models\Payment::factory()->create(['order_id' => $order->id, 'status' => 'pending']);

    (new \App\Jobs\ExpireInventoryReservationsJob)->handle();

    expect($order->refresh()->status)->toBe(\App\Enums\OrderStatus::Cancelled);
    expect(InventoryReservation::where('order_id', $order->id)->first()->status)->toBe('expired');
});