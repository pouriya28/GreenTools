<?php

namespace App\Services\Loyalty;

use App\Models\CustomerLevel;

class LevelResolver
{
    /**
     * Resolve which CustomerLevel a given point total currently belongs to.
     * Returns null only if no active level matches at all (e.g. the levels
     * table hasn't been seeded yet) — callers must handle that case.
     */
    public function resolve(int $totalPoints): ?CustomerLevel
    {
        return CustomerLevel::query()
            ->where('is_active', true)
            ->where('min_points', '<=', $totalPoints)
            ->where(function ($query) use ($totalPoints) {
                $query->whereNull('max_points')
                    ->orWhere('max_points', '>=', $totalPoints);
            })
            ->orderByDesc('min_points')
            ->first();
    }
}