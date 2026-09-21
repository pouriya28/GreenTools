<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'username' => null,
            'email' => fake()->unique()->safeEmail(),
            'phone' => null,
            'email_verified_at' => now(),
            'phone_verified_at' => null,
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'user_type' => 'customer',
            'is_active' => true,
            'failed_login_attempts' => 0,
            'locked_until' => null,
            'two_factor_enabled' => false,
            'two_factor_secret' => null,
        ];
    }

    public function customer(): static
    {
        return $this->state(fn (array $attributes): array => [
            'user_type' => 'customer',
        ]);
    }

    public function staff(): static
    {
        return $this->state(fn (array $attributes): array => [
            'user_type' => 'staff',
            'username' => fake()->unique()->userName(),
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_active' => false,
        ]);
    }

    public function locked(int $minutes = 15): static
    {
        return $this->state(fn (array $attributes): array => [
            'failed_login_attempts' => 0,
            'locked_until' => now()->addMinutes($minutes),
        ]);
    }

    public function withTwoFactor(
        string $secret = 'JBSWY3DPEHPK3PXP'
    ): static {
        return $this->state(fn (array $attributes): array => [
            'two_factor_enabled' => true,
            'two_factor_secret' => $secret,
        ]);
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes): array => [
            'email_verified_at' => null,
        ]);
    }
}