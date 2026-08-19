<?php

namespace App\Enums;

enum PriceProposalStatus: string
{
    case PendingReview = 'pending_review';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Edited = 'edited';

    public function isFinal(): bool
    {
        return $this === self::Approved || $this === self::Rejected;
    }
}
