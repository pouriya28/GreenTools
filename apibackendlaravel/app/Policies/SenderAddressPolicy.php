<?php
// app/Policies/SenderAddressPolicy.php

namespace App\Policies;

use App\Models\User;

class SenderAddressPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('orders.view'); // هرکسی که می‌تونه لیبل بسازه باید بتونه لیست فرستنده‌ها رو ببینه
    }

    public function manage(User $user): bool
    {
        return $user->can('shipping.manage');
    }
}