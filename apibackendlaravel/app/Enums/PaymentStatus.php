<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Failed = 'failed';

    /**
     * Strict transitions, mirroring OrderStatus::allowedNextStates().
     * - Pending can resolve to Paid or Failed (the two callback outcomes).
     * - Failed can go back to Pending only when the customer retries checkout
     *   with a new PaymentAttempt.
     * - Paid is terminal: once confirmed, no gateway callback should ever be
     *   allowed to move it away from Paid (replay/duplicate webhook safety).
     */
    public function allowedNextStates(): array
    {
        return match ($this) {
            self::Pending => [self::Paid, self::Failed],
            self::Failed => [self::Pending],
            self::Paid => [],
        };
    }

    public function canTransitionTo(self $next): bool
    {
        return in_array($next, $this->allowedNextStates(), true);
    }
}