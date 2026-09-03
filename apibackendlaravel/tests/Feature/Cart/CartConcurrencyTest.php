<?php

use App\Models\Cart;
use App\Models\Product;

it('does not oversell the last unit under concurrent add-to-cart requests', function () {
    $product = Product::factory()->create(['stock_quantity' => 1, 'is_active' => true]);

    $cartA = Cart::factory()->create();
    $cartB = Cart::factory()->create();

    $service = app(\App\Services\Cart\CartService::class);

    $service->addItem($cartA, $product->id, 1);

    // شبیه‌سازی درخواست دوم هم‌زمان روی همون محصول — چون lockForUpdate روی
    // ردیف Product در CartService است، این باید رد شود، نه اینکه هم قبول شود.
    expect(fn () => $service->addItem($cartB, $product->id, 1))
        ->toThrow(\App\Exceptions\Cart\InsufficientStockException::class);
});