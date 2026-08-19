<?php

namespace App\Policies;

use App\Models\User;

class ProductPriceProposalPolicy
{
    private function isEligibleStaff(User $user): bool
    {
        return $user->user_type === 'staff' && $user->is_active;
    }

    // بررسی/تایید/رد پیشنهادهای قیمت - permission جدید prices.review، جدا از
    // products.manage، چون تایید انبوه قیمت‌ها حساس‌تره از ویرایش یک محصول.
    // پیش‌فرض: اگه prices.review نبود ولی prices.manage بود هم قبول می‌شه
    // (قابل تغییر بعداً اگه بخوای کاملاً مجزا باشه).
    public function viewAny(User $user): bool
    {
        return $this->isEligibleStaff($user) && ($user->can('prices.review') || $user->can('prices.manage'));
    }

    public function view(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function review(User $user): bool
    {
        return $this->viewAny($user);
    }
}
