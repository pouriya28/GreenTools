<?php

namespace App\Exceptions\Payment;

use App\Enums\PaymentStatus;
use RuntimeException;

class InvalidPaymentTransitionException extends RuntimeException
{
    public function __construct(
        public readonly PaymentStatus $from,
        public readonly PaymentStatus $to,
    ) {
        parent::__construct("Cannot transition payment from {$from->value} to {$to->value}.");
    }
}