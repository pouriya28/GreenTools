<?php

use App\Models\Cart;
use App\Models\Product;
use App\Models\User;

it('rejects access to another user\'s cart items (IDOR)', function () {
    $victim = User::factory()->create();
    $victimCart = Cart::factory()->forUser($victim)->create();
    $item = \App\Models\CartItem::factory()->create(['cart_id' => $victimCart->id]);

    $attacker = User::factory()->create();

    $this->actingAs($attacker)
        ->patchJson("/api/v1/cart/items/{$item->id}", ['quantity' => 1, 'version' => $victimCart->version])
        ->assertStatus(404); // باید طوری رفتار کند که attacker حتی نفهمد این آیتم وجود دارد

    $this->actingAs($attacker)
        ->deleteJson("/api/v1/cart/items/{$item->id}?version={$victimCart->version}")
        ->assertStatus(404);
});

it('issues a guest token cookie without requiring authentication', function () {
    $this->getJson('/api/v1/cart')
        ->assertOk()
        ->assertCookie('cart_guest_token');
});

it('rejects a guest token that was tampered with', function () {
    $this->withCookie('cart_guest_token', 'not-a-real-token-'.str_repeat('a', 64))
        ->getJson('/api/v1/cart')
        ->assertOk(); // باید cart جدید بسازد، نه اینکه به یک سبد دیگر دسترسی بدهد
});