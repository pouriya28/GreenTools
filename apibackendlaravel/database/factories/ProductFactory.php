<?php

namespace Database\Factories;

use App\Enums\StockStatus;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $name     = $this->faker->unique()->words(4, true);
        $priceUsd = $this->faker->randomFloat(2, 5, 500);

        return [
            'category_id'       => Category::factory(),
            'name'              => ucfirst($name),
            'slug'              => Str::slug($name) . '-' . $this->faker->unique()->numberBetween(1000, 9999),
            'sku'               => 'TEST-' . strtoupper($this->faker->unique()->bothify('??###')),
            'short_description' => $this->faker->optional()->sentence(),
            'description'       => $this->faker->optional()->paragraph(),
            'price_usd'         => $priceUsd,
            'price_toman'       => (int) round($priceUsd * 50000), // not fillable, factory is unguarded
            'stock_quantity'    => $this->faker->numberBetween(1, 500),
            'stock_status'      => StockStatus::InStock,
            'is_active'         => true,
            'is_featured'       => false,
            'created_by'        => null,
            'updated_by'        => null,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }

    public function featured(): static
    {
        return $this->state(['is_featured' => true]);
    }

    public function outOfStock(): static
    {
        return $this->state([
            'stock_status'   => StockStatus::OutOfStock,
            'stock_quantity' => 0,
        ]);
    }
}