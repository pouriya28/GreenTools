<?php

namespace Database\Factories;

use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<RefreshToken>
 */
class RefreshTokenFactory extends Factory
{
    protected $model = RefreshToken::class;

    public function definition(): array
    {
        return [
            'family_id'      => (string) Str::uuid(),
            'user_id'        => User::factory(),
            'token_hash'     => hash('sha256', bin2hex(random_bytes(32))),
            'expires_at'     => now()->addDays(7),
            'ip_address'     => $this->faker->ipv4(),
            'user_agent'     => substr($this->faker->userAgent(), 0, 255),
            'used_at'        => null,
            'revoked_at'     => null,
            'replaced_by_id' => null,
        ];
    }

    public function expired(): static
    {
        return $this->state(fn (): array => [
            'expires_at' => now()->subDay(),
        ]);
    }

    public function used(int $secondsAgo = 30): static
    {
        return $this->state(fn (): array => [
            'used_at' => now()->subSeconds($secondsAgo),
        ]);
    }

    public function revoked(): static
    {
        return $this->state(fn (): array => [
            'revoked_at' => now()->subMinute(),
        ]);
    }
}