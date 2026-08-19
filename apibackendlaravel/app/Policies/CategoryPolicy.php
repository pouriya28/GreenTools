<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;

class CategoryPolicy
{
    private function isEligibleStaff(User $user): bool
    {
        return $user->user_type === 'staff'
            && $user->is_active === true;
    }

    private function hasAccess(
        User $user,
        string $permission
    ): bool {
        return $this->isEligibleStaff($user)
            && $user->can($permission);
    }

    private function hasTrashAccess(User $user): bool
    {
        return $this->hasAccess(
            $user,
            'categories.trash'
        );
    }

    public function viewAny(User $user): bool
    {
        return $this->hasAccess(
            $user,
            'categories.view'
        );
    }

    public function view(
        User $user,
        Category $category
    ): bool {
        return $this->hasAccess(
            $user,
            'categories.view'
        );
    }

    public function create(User $user): bool
    {
        return $this->hasAccess(
            $user,
            'categories.create'
        );
    }

    public function update(
        User $user,
        Category $category
    ): bool {
        return $this->hasAccess(
            $user,
            'categories.update'
        );
    }

    public function delete(
        User $user,
        Category $category
    ): bool {
        return $this->hasAccess(
            $user,
            'categories.delete'
        );
    }

    public function viewTrash(User $user): bool
    {
        return $this->hasTrashAccess($user);
    }

    public function restore(User $user): bool
    {
        return $this->hasTrashAccess($user);
    }

    public function forceDelete(User $user): bool
    {
        return $this->hasTrashAccess($user);
    }

    /*
     * این متد دیگر نباید در endpointهای جدید استفاده شود.
     *
     * فقط برای compatibility با کدهای قدیمی باقی می‌ماند.
     */
    public function manage(User $user): bool
    {
        return $this->isEligibleStaff($user)
            && $user->can('categories.manage');
    }
}