<?php

namespace Database\Factories;

use App\Models\Cart;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CartFactory extends Factory
{
    protected $model = Cart::class;

    public function definition(): array
    {
        return [
            'user_id'     => null,
            'guest_token' => bin2hex(random_bytes(32)),
            'status'      => 'active',
            'version'     => 1,
            'expires_at'  => null,
        ];
    }

    /** Attach the cart to an authenticated user (clears guest_token). */
    public function forUser(?User $user = null): static
    {
        return $this->state(fn () => [
            'user_id'     => ($user ?? User::factory()->create())->id,
            'guest_token' => null,
        ]);
    }

    /** Already-merged guest cart. */
    public function converted(): static
    {
        return $this->state(fn () => ['status' => 'converted']);
    }

    /** Expired cart (past its TTL). */
    public function expired(): static
    {
        return $this->state(fn () => [
            'status'     => 'active',
            'expires_at' => now()->subHour(),
        ]);
    }
}
