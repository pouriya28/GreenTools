<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        $name = $this->faker->unique()->words(3, true);
        return [
            'parent_id'   => null,
            'name'        => ucfirst($name),
            'slug'        => Str::slug($name) . '-' . $this->faker->unique()->numberBetween(100, 9999),
            'description' => $this->faker->optional()->sentence(),
            'is_active'   => true,
            'created_by'  => null,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}