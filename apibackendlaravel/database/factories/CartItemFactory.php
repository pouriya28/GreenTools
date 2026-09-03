<?php

namespace Database\Factories;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class CartItemFactory extends Factory
{
    protected $model = CartItem::class;

    public function definition(): array
    {
        return [
            'cart_id' => Cart::factory(),
            'product_id' => Product::factory(),
            'quantity' => $this->faker->numberBetween(1, 5),
            'price_at_addition' => $this->faker->numberBetween(100000, 5000000),
            'discount_at_addition' => 0,
            'purchase_requirement_at_addition' => 'standard',
            'purchase_confirmed' => false,
        ];
    }
}
