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

        // Newly created customers may not have loyalty_points initialized yet.
        $loyaltyPoints = $user->loyalty_points ?? 0;

        // Fallback for the rare case where customer_level_id is still null
        // (e.g. a user created before this feature existed) — resolve it
        // live rather than showing "no level" to a paying customer.
        $currentLevel = $user->customerLevel ?? $this->levelResolver->resolve($loyaltyPoints);

        $nextLevel = CustomerLevel::query()
            ->where('is_active', true)
            ->when($currentLevel, fn ($q) => $q->where('sort_order', '>', $currentLevel->sort_order))
            ->orderBy('sort_order')
            ->first();

        $progressPercent = null;
        if ($nextLevel) {
            $currentMin = $currentLevel?->min_points ?? 0;
            $range = $nextLevel->min_points - $currentMin;
            $earned = $loyaltyPoints - $currentMin;
            $progressPercent = $range > 0
                ? (int) round(min(100, max(0, ($earned / $range) * 100)))
                : 0;
        }

        return [
            'points' => $loyaltyPoints,
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
                'points_remaining' => max(0, $nextLevel->min_points - $loyaltyPoints),
            ] : null,
            'progress_percent' => $progressPercent,
        ];
    }
}