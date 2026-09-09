<?php
// app/Services/Shipping/ShippingQuote.php

namespace App\Services\Shipping;

// Immutable value object — never persisted directly. CheckoutService copies
// its fields onto the Order as a snapshot at checkout time.
final class ShippingQuote
{
    public function __construct(
        public readonly int $shippingMethodId,
        public readonly string $methodName,
        public readonly string $calculationType,
        public readonly int $cost,
        public readonly ?int $estimatedDaysMin,
        public readonly ?int $estimatedDaysMax,
        public readonly bool $isFreeShipping,
    ) {
    }
}