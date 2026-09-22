<?php
// app/Policies/ShippingMethodPolicy.php

namespace App\Policies;

use App\Models\User;

class ShippingMethodPolicy
{
    // guard_name is 'sanctum' on User (Spatie laravel-permission) — must match
    // when the 'shipping.manage' permission is created, or ->can() always
    // returns false regardless of assignment (same trap hit with prices.manual_override).
    public function viewAny(User $user): bool
    {
        return $user->can('shipping.manage');
    }

    public function create(User $user): bool
    {
        return $user->can('shipping.manage');
    }

    public function update(User $user): bool
    {
        return $user->can('shipping.manage');
    }

    public function delete(User $user): bool
    {
        return $user->can('shipping.manage');
    }
}