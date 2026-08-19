<?php

namespace App\Exceptions\Pricing;

use App\Exceptions\ApiException;

class PriceProposalAlreadyReviewedException extends ApiException
{
    private function __construct(string $debugMessage)
    {
        parent::__construct($debugMessage);
    }

    public static function alreadyReviewed(): self
    {
        return new self('Price proposal was already approved or rejected.');
    }

    public function errorCode(): string
    {
        return 'PRICE_PROPOSAL_ALREADY_REVIEWED';
    }

    public function statusCode(): int
    {
        return 409;
    }

    public function userMessage(): string
    {
        return 'این پیشنهاد قیمت قبلاً بررسی شده (تایید یا رد شده) و قابل تغییر مجدد نیست.';
    }
}
