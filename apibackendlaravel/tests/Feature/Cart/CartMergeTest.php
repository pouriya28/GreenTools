<?php

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use App\Services\Cart\CartMergeService;

it('merges guest cart quantities into the user cart, capped by stock and max limit', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create(['is_active' => true, 'stock_quantity' => 10]);

    $guestCart = Cart::factory()->create(['user_id' => null, 'guest_token' => 'guest-token-123']);
    CartItem::factory()->create(['cart_id' => $guestCart->id, 'product_id' => $product->id, 'quantity' => 8]);

    $userCart = Cart::factory()->create(['user_id' => $user->id]);
    CartItem::factory()->create(['cart_id' => $userCart->id, 'product_id' => $product->id, 'quantity' => 7]);

    app(CartMergeService::class)->merge($user->id, 'guest-token-123');

    $mergedItem = CartItem::where('cart_id', $userCart->id)->where('product_id', $product->id)->first();

    expect($mergedItem->quantity)->toBe(10); // capped by stock_quantity, not 15
    expect(Cart::find($guestCart->id)->status)->toBe('converted');
});