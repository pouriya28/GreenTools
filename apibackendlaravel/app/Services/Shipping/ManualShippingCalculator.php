<?php
// app/Services/Shipping/ManualShippingCalculator.php

namespace App\Services\Shipping;

use App\Contracts\ShippingCalculatorInterface;
use App\Enums\ShippingCalculationType;
use App\Exceptions\Shipping\ShippingMethodNotSupportedException;
use App\Exceptions\Shipping\ShippingMethodUnavailableException;
use App\Models\Address;
use App\Models\ShippingMethod;

// Phase 1/2: fixed price or price-per-kilogram, both configured manually by
// the admin. Phase 3 (zone + weight) and Phase 4 (real courier API, e.g.
// PostApiShippingCalculator / TipaxApiShippingCalculator) ship later as
// separate classes behind the same ShippingCalculatorInterface — Checkout
// and Order never need to know which implementation is bound.
class ManualShippingCalculator implements ShippingCalculatorInterface
{
    public function calculate(
        ShippingMethod $method,
        int $cartWeightGrams,
        int $cartSubtotal,
        ?Address $address = null,
    ): ShippingQuote {
        if (! $method->is_active) {
            throw new ShippingMethodUnavailableException($method->id);
        }

        if (! $method->coversWeight($cartWeightGrams)) {
            throw new ShippingMethodUnavailableException($method->id);
        }

        $cost = match ($method->calculation_type) {
            ShippingCalculationType::Fixed => $method->base_cost,
            ShippingCalculationType::Weight => $this->calculateByWeight($method, $cartWeightGrams),
            ShippingCalculationType::WeightZone => throw new ShippingMethodNotSupportedException($method->id),
        };

        $isFreeShipping = $method->free_shipping_enabled
            && $method->free_shipping_threshold !== null
            && $cartSubtotal >= $method->free_shipping_threshold;

        if ($isFreeShipping) {
            $cost = 0;
        }

        return new ShippingQuote(
            shippingMethodId: $method->id,
            methodName: $method->name,
            calculationType: $method->calculation_type->value,
            cost: $cost,
            estimatedDaysMin: $method->estimated_days_min,
            estimatedDaysMax: $method->estimated_days_max,
            isFreeShipping: $isFreeShipping,
        );
    }

    private function calculateByWeight(ShippingMethod $method, int $cartWeightGrams): int
    {
        $costPerKg = $method->cost_per_kg ?? 0;
        $weightKg = $cartWeightGrams / 1000;

        return (int) round($method->base_cost + ($weightKg * $costPerKg));
    }
}