<?php

namespace App\Services\Loyalty;

use App\Events\LevelUpgraded;
use App\Models\LoyaltyPointTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

class LoyaltyService
{
    public function __construct(private readonly LevelResolver $levelResolver) {}

    /**
     * The ONLY sanctioned entry point for increasing a user's loyalty points.
     * In the current business model points are never spent, so there is
     * intentionally no "deduct" counterpart — adding one would reopen all
     * the race-condition and negative-balance concerns this design avoids.
     *
     * Wrapped in a DB transaction with a row lock on the user, so two
     * concurrent grants (e.g. an order completing and a review being
     * submitted at nearly the same instant) can never silently overwrite
     * one another (the classic "lost update" problem).
     */
    public function addPoints(
        string $userId,
        int $points,
        string $type,
        ?string $referenceType = null,
        ?string $referenceId = null,
        ?string $description = null,
        ?string $grantedBy = null,
    ): User {
        if ($points <= 0) {
            throw new InvalidArgumentException('Loyalty points to add must be a positive integer.');
        }

        return DB::transaction(function () use ($userId, $points, $type, $referenceType, $referenceId, $description, $grantedBy) {
            /** @var User $user */
            $user = User::query()->whereKey($userId)->lockForUpdate()->firstOrFail();

            $previousLevelId = $user->customer_level_id;

            LoyaltyPointTransaction::create([
                'user_id' => $user->id,
                'type' => $type,
                'points' => $points,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'description' => $description,
                'granted_by' => $grantedBy,
            ]);

            $newTotal = $user->loyalty_points + $points;
            $user->loyalty_points = $newTotal;

            $resolvedLevel = $this->levelResolver->resolve($newTotal);
            $levelChanged = $resolvedLevel && $resolvedLevel->id !== $previousLevelId;

            if ($levelChanged) {
                $user->customer_level_id = $resolvedLevel->id;
            }

            $user->save();

            Log::info('loyalty.points_added', [
                'user_id' => $user->id,
                'points' => $points,
                'type' => $type,
                'new_total' => $newTotal,
            ]);

            if ($levelChanged) {
                event(new LevelUpgraded($user, $previousLevelId, $resolvedLevel->id));
            }

            return $user->fresh(['customerLevel']);
        });
    }
}