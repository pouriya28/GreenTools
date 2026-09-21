<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Notifications\Notification;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;
    use HasRoles;
    use HasUlids;
    use Notifiable;

    protected $guard_name = 'sanctum';

    protected $fillable = [
        'name',
        'username',
        'email',
        'phone',
        'password',
    ];

    // These fields must only be written by trusted internal services.
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'operation_password_hash',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'locked_until' => 'datetime',
            'password' => 'hashed',
            'two_factor_enabled' => 'boolean',
            'is_active' => 'boolean',
            'loyalty_points' => 'integer',
            'failed_login_attempts' => 'integer',
        ];
    }

    public function isCustomer(): bool
    {
        return $this->user_type === 'customer';
    }

    public function isStaff(): bool
    {
        return $this->user_type === 'staff';
    }
    public function activate(): void
    {
        $this->is_active = true;
        $this->save();
    }

    public function deactivate(): void
    {
        $this->is_active = false;
        $this->save();
    }
    public function recordLogin(): void
    {
        $this->last_login_at = now();
        $this->save();
    }

    public function clearLoginFailures(): void
    {
        $this->failed_login_attempts = 0;
        $this->locked_until = null;
        $this->save();
    }

    public function applyLockout(int $minutes): void
    {
        $this->locked_until = now()->addMinutes($minutes);
        $this->failed_login_attempts = 0;
        $this->save();
    }

    public function setTwoFactorSecret(string $secret): void
    {
        $this->two_factor_secret = $secret;
        $this->save();
    }

    public function enableTwoFactor(): void
    {
        $this->two_factor_enabled = true;
        $this->save();
    }

    public function disableTwoFactor(): void
    {
        $this->two_factor_enabled = false;
        $this->two_factor_secret = null;
        $this->save();
    }
    

    public function customerLevel(): BelongsTo
    {
        return $this->belongsTo(CustomerLevel::class, 'customer_level_id');
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function routeNotificationForBale(Notification $notification): ?string
    {
        // Anyone who can access admin orders is eligible for Bale alerts.
        $isEligibleForOrderAlerts = in_array(
            $this->user_type,
            ['admin', 'staff'],
            true
        ) && $this->can('orders.view');

        if (! $isEligibleForOrderAlerts) {
            return null;
        }

        return $this->bale_chat_id;
    }

    public function wishlists(): HasMany
    {
        return $this->hasMany(Wishlist::class);
    }
}