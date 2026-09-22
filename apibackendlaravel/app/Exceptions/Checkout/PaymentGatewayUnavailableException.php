<?php

namespace App\Exceptions\Checkout;

use RuntimeException;

class PaymentGatewayUnavailableException extends RuntimeException
{
    public function __construct(public readonly string $gatewaySlug)
    {
        parent::__construct("Payment gateway '{$gatewaySlug}' is not available.");
    }
}