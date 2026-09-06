<?php

namespace App\Services\Loyalty;

use App\Models\CustomerLevel;
use App\Models\User;

class LoyaltyPresenter
{
    public function __construct(private readonly LevelResolver $levelResolver) {}

    /**
     * Builds the loyalty payload embedded in every auth response
     * (login / verify-otp / refresh) and returned by GET /v1/customer/loyalty/me.
     * Returns null for staff accounts — loyalty is a customer-only concept.
     */
    public function present(User $user): ?array
    {
        if (!$user->isCustomer()) {
            return null;
        }

        $user->loadMissing('customerLevel');

        // Fallback for the rare case where customer_level_id is still null
        // (e.g. a user created before this feature existed) — resolve it
        // live rather than showing "no level" to a paying customer.
        $currentLevel = $user->customerLevel ?? $this->levelResolver->resolve($user->loyalty_points);

        $nextLevel = CustomerLevel::query()
            ->where('is_active', true)
            ->where('sort_order', '>', $currentLevel?->sort_order ?? 0)
            ->orderBy('sort_order')
            ->first();

        $progressPercent = null;
        if ($nextLevel) {
            $currentMin = $currentLevel?->min_points ?? 0;
            $range = $nextLevel->min_points - $currentMin;
            $earned = $user->loyalty_points - $currentMin;
            $progressPercent = $range > 0
                ? (int) round(min(100, max(0, ($earned / $range) * 100)))
                : 0;
        }

        return [
            'points' => $user->loyalty_points,
            'level' => $currentLevel ? [
                'code' => $currentLevel->code,
                'name' => $currentLevel->name,
                'icon' => $currentLevel->icon,
            ] : null,
            'next_level' => $nextLevel ? [
                'code' => $nextLevel->code,
                'name' => $nextLevel->name,
                'icon' => $nextLevel->icon,
                'points_required' => $nextLevel->min_points,
                'points_remaining' => max(0, $nextLevel->min_points - $user->loyalty_points),
            ] : null,
            'progress_percent' => $progressPercent,
        ];
    }
}