<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

it('creates a valid default customer with a ULID', function (): void {
    $user = User::factory()->create();

    expect(Str::isUlid((string) $user->id))->toBeTrue()
        ->and($user->user_type)->toBe('customer')
        ->and($user->is_active)->toBeTrue()
        ->and($user->failed_login_attempts)->toBe(0)
        ->and($user->locked_until)->toBeNull()
        ->and($user->two_factor_enabled)->toBeFalse()
        ->and(Hash::check('password', $user->password))->toBeTrue();
});

it('supports staff lockout inactivity and two-factor states', function (): void {
    $user = User::factory()
        ->staff()
        ->inactive()
        ->locked()
        ->withTwoFactor()
        ->create();

    expect($user->user_type)->toBe('staff')
        ->and($user->username)->not->toBeNull()
        ->and($user->is_active)->toBeFalse()
        ->and($user->locked_until)->not->toBeNull()
        ->and($user->locked_until->isFuture())->toBeTrue()
        ->and($user->two_factor_enabled)->toBeTrue()
        ->and($user->two_factor_secret)->toBe(
            'JBSWY3DPEHPK3PXP'
        );
});