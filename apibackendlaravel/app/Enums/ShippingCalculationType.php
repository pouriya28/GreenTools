<?php
// app/Enums/ShippingCalculationType.php

namespace App\Enums;

enum ShippingCalculationType: string
{
    case Fixed = 'fixed';
    case Weight = 'weight';
    // Reserved for Phase 3 (zone + weight). ManualShippingCalculator throws
    // ShippingMethodNotSupportedException for this case until then.
    case WeightZone = 'weight_zone';

    public function label(): string
    {
        return match ($this) {
            self::Fixed => 'ثابت',
            self::Weight => 'بر اساس وزن',
            self::WeightZone => 'بر اساس وزن + منطقه',
        };
    }
}
