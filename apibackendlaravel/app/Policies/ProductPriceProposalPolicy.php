<?php

namespace App\Policies;

use App\Models\User;

class ProductPriceProposalPolicy
{
    // باگ امنیتی واقعی (همون الگویی که در ProductPolicy هم وجود دارد): این مقدار
    // قبلاً فقط user_type === 'staff' رو مجاز می‌دانست، در حالی که طبق AuthUser.type
    // در فرانت، هم 'admin' هم 'staff' از نقش‌های پنل ادمین محسوب می‌شنند. با منطق قبلی، یک
    // ادمین واقعی با permission درست (prices.review یا prices.manage) هم 403 می‌گرفت. اینجا همون
    // مجموعه‌ی STAFF_USER_TYPES که طرف فرانت (ProtectedRoute.tsx) استفاده می‌شه رو روی
    // بک‌اند هم اعمال می‌کنیم.
    private const ELIGIBLE_STAFF_TYPES = ['admin', 'staff'];

    private function isEligibleStaff(User $user): bool
    {
        return in_array($user->user_type, self::ELIGIBLE_STAFF_TYPES, true) && $user->is_active;
    }

    // بررسی/تایید/رد پیشنهادهای قیمت - permission جدید prices.review، جدا از
    // products.manage، چون تایید انبوه‌ی قیمت‌ها حساس‌تره از ویرایش یک محصوله. پیش‌فرض:
    // اگه prices.review نبود ولی prices.manage بود هم قبول می‌شه (قابل تقییر بعداً اگه بخوای
    // کاملاً مجزا باشه).
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
