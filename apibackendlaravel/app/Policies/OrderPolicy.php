<?php
// app/Policies/OrderPolicy.php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    private function isEligibleStaff(User $user): bool
    {
        return in_array($user->user_type, ['admin', 'staff'], true) && $user->is_active;
    }

    public function viewAny(User $user): bool
    {
        return $this->isEligibleStaff($user) && $user->can('orders.view');
    }

    public function view(User $user, Order $order): bool
    {
        if ($this->isEligibleStaff($user)) {
            return $user->can('orders.view');
        }

        return $order->user_id === $user->id;
    }

    // Status transitions are a write/update, so this maps to orders.update —
    // NOT orders.delete (that permission is reserved for actually deleting
    // an order record and is flagged requires_operation_confirmation).
    public function updateStatus(User $user, Order $order): bool
    {
        return $this->isEligibleStaff($user) && $user->can('orders.update');
    }
}