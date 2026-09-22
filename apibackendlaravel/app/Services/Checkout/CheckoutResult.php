<?php

namespace App\Services\Checkout;

use App\Models\Order;

final class CheckoutResult
{
    public function __construct(
        public readonly Order $order,
        public readonly string $paymentIntentUrl,
    ) {
    }
}