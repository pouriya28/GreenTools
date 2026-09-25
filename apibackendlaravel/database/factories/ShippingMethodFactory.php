<?php

namespace Database\Factories;

use App\Enums\ShippingCalculationType;
use App\Models\ShippingMethod;
use Illuminate\Database\Eloquent\Factories\Factory;

class ShippingMethodFactory extends Factory
{
    protected $model = ShippingMethod::class;

    public function definition(): array
    {
        return [
            'name'                     => $this->faker->words(2, true),
            'code'                     => $this->faker->unique()->slug(2),
            'base_cost'                => 50_000,
            'calculation_type' => ShippingCalculationType::Fixed,
            'cost_per_kg'              => 0,
            'min_weight_grams'         => null,
            'max_weight_grams'         => null,
            'free_shipping_enabled'    => false,
            'free_shipping_threshold'  => null,
            'estimated_days_min'       => 2,
            'estimated_days_max'       => 5,
            'is_active'                => true,
            'sort_order'               => 0,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
