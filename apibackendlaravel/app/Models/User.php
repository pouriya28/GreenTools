<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, HasRoles, Notifiable;

    protected $guard_name = 'sanctum';

    protected $fillable = [
        'name',
        'username',
        'email',
        'phone',
        'password',
    ];

    // operation_password_hash and loyalty fields are intentionally excluded
    // from $fillable — they must only ever be written by internal services
    // (OperationPasswordController, LoyaltyService), never via a generic
    // mass-assignment call built from raw request input.
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

    public function customerLevel(): BelongsTo
    {
        return $this->belongsTo(CustomerLevel::class, 'customer_level_id');
    }
    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    // canAccessPanel(Panel $panel) removed: leftover from the Filament admin
    // panel, which has been fully replaced by the custom React admin panel.
    // The Panel class no longer exists in this project, so this method would
    // have caused a fatal error the moment anything tried to call it.
}