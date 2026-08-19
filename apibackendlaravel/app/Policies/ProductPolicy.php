<?php

namespace App\Policies;

use App\Models\User;

class ProductPolicy
{
    private function isEligibleStaff(User $user): bool
    {
        return $user->user_type === 'staff' && $user->is_active;
    }

    private function hasAccess(User $user, string $ability): bool
    {
        return $this->isEligibleStaff($user)
            && ($user->can("products.{$ability}") || $user->can('products.manage'));
    }

  
    private function hasTrashAccess(User $user): bool
    {
        return $this->isEligibleStaff($user) && $user->can('products.trash');
    }

    public function viewAny(User $user): bool { return $this->hasAccess($user, 'view'); }
    public function view(User $user): bool { return $this->hasAccess($user, 'view'); }
    public function create(User $user): bool { return $this->hasAccess($user, 'create'); }
    public function update(User $user): bool { return $this->hasAccess($user, 'update'); }
    public function delete(User $user): bool { return $this->hasAccess($user, 'delete'); }
    public function deleteAny(User $user): bool { return $this->hasAccess($user, 'delete'); }

    // مشاهده‌ی لیست سطل‌زباله هم پشت همون permission سخت‌گیرانه‌ست، چون
    // خودِ اسم/اطلاعات محصولات حذف‌شده می‌تونه حساس باشه.
    public function viewTrash(User $user): bool { return $this->hasTrashAccess($user); }

    public function restore(User $user): bool { return $this->hasTrashAccess($user); }
    public function restoreAny(User $user): bool { return $this->hasTrashAccess($user); }
    public function forceDelete(User $user): bool { return $this->hasTrashAccess($user); }
    public function forceDeleteAny(User $user): bool { return $this->hasTrashAccess($user); }

    public function manage(User $user): bool
    {
        return $this->isEligibleStaff($user) && $user->can('products.manage');
    }
}