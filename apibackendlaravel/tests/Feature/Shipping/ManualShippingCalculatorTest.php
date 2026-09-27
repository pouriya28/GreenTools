<?php

use App\Enums\ShippingCalculationType;
use App\Exceptions\Shipping\ShippingMethodNotSupportedException;
use App\Exceptions\Shipping\ShippingMethodUnavailableException;
use App\Models\ShippingMethod;
use App\Services\Shipping\ManualShippingCalculator;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    Http::preventStrayRequests();
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeMethod(array $attrs = []): ShippingMethod
{
    return ShippingMethod::factory()->create(array_merge([
        'is_active'              => true,
        'calculation_type'       => ShippingCalculationType::Fixed,
        'base_cost'              => 50000,
        'free_shipping_enabled'  => false,
        'free_shipping_threshold'=> null,
        'min_weight_grams'       => null,
        'max_weight_grams'       => null,
    ], $attrs));
}

function calculator(): ManualShippingCalculator
{
    return app(ManualShippingCalculator::class);
}

// ---------------------------------------------------------------------------
// Fixed calculation
// ---------------------------------------------------------------------------

describe('ManualShippingCalculator — Fixed', function () {

    it('returns base_cost for fixed calculation type', function () {
        $method = makeMethod(['base_cost' => 50000, 'calculation_type' => ShippingCalculationType::Fixed]);

        $quote = calculator()->calculate($method, 0, 100000);

        expect($quote->cost)->toBe(50000);
    });

    it('ignores cart weight for fixed type', function () {
        $method = makeMethod(['base_cost' => 50000, 'calculation_type' => ShippingCalculationType::Fixed]);

        $quote1 = calculator()->calculate($method, 0, 100000);
        $quote2 = calculator()->calculate($method, 10000, 100000);

        expect($quote1->cost)->toBe($quote2->cost);
    });

    it('returns correct method name and id in quote', function () {
        $method = makeMethod(['name' => 'Express Post', 'calculation_type' => ShippingCalculationType::Fixed]);

        $quote = calculator()->calculate($method, 0, 100000);

        expect($quote->methodName)->toBe('Express Post');
        expect($quote->shippingMethodId)->toBe($method->id);
    });

});

// ---------------------------------------------------------------------------
// Weight-based calculation
// ---------------------------------------------------------------------------

describe('ManualShippingCalculator — Weight', function () {

    it('calculates cost based on weight', function () {
        $method = makeMethod([
            'calculation_type' => ShippingCalculationType::Weight,
            'base_cost'        => 20000,
            'cost_per_kg'      => 5000,
        ]);

        // 2kg → 20000 + (2 * 5000) = 30000
        $quote = calculator()->calculate($method, 2000, 100000);

        expect($quote->cost)->toBe(30000);
    });

    it('rounds fractional gram calculations correctly', function () {
        $method = makeMethod([
            'calculation_type' => ShippingCalculationType::Weight,
            'base_cost'        => 10000,
            'cost_per_kg'      => 3000,
        ]);

        // 1500g = 1.5kg → 10000 + (1.5 * 3000) = 14500
        $quote = calculator()->calculate($method, 1500, 100000);

        expect($quote->cost)->toBe(14500);
    });

    it('uses base_cost when cost_per_kg is null (zero weight cost)', function () {
        $method = makeMethod([
            'calculation_type' => ShippingCalculationType::Weight,
            'base_cost'        => 15000,
            'cost_per_kg'      => null,
        ]);

        $quote = calculator()->calculate($method, 5000, 100000);

        expect($quote->cost)->toBe(15000);
    });

});

// ---------------------------------------------------------------------------
// Free shipping
// ---------------------------------------------------------------------------

describe('ManualShippingCalculator — Free Shipping', function () {

    it('applies free shipping when subtotal meets threshold', function () {
        $method = makeMethod([
            'base_cost'               => 50000,
            'calculation_type'        => ShippingCalculationType::Fixed,
            'free_shipping_enabled'   => true,
            'free_shipping_threshold' => 500000,
        ]);

        $quote = calculator()->calculate($method, 0, 500000); // exactly at threshold

        expect($quote->cost)->toBe(0);
        expect($quote->isFreeShipping)->toBeTrue();
    });

    it('does not apply free shipping when subtotal is below threshold', function () {
        $method = makeMethod([
            'base_cost'               => 50000,
            'calculation_type'        => ShippingCalculationType::Fixed,
            'free_shipping_enabled'   => true,
            'free_shipping_threshold' => 500000,
        ]);

        $quote = calculator()->calculate($method, 0, 499999); // one toman below

        expect($quote->cost)->toBe(50000);
        expect($quote->isFreeShipping)->toBeFalse();
    });

    it('does not apply free shipping when disabled', function () {
        $method = makeMethod([
            'base_cost'               => 50000,
            'calculation_type'        => ShippingCalculationType::Fixed,
            'free_shipping_enabled'   => false,
            'free_shipping_threshold' => 100000,
        ]);

        $quote = calculator()->calculate($method, 0, 999999);

        expect($quote->cost)->toBe(50000);
        expect($quote->isFreeShipping)->toBeFalse();
    });

    it('free shipping overrides weight-based cost', function () {
        $method = makeMethod([
            'calculation_type'        => ShippingCalculationType::Weight,
            'base_cost'               => 20000,
            'cost_per_kg'             => 5000,
            'free_shipping_enabled'   => true,
            'free_shipping_threshold' => 300000,
        ]);

        $quote = calculator()->calculate($method, 5000, 300000);

        expect($quote->cost)->toBe(0);
        expect($quote->isFreeShipping)->toBeTrue();
    });

});

// ---------------------------------------------------------------------------
// Weight constraints
// ---------------------------------------------------------------------------

describe('ManualShippingCalculator — Weight Constraints', function () {

    it('throws when cart weight is below min_weight_grams', function () {
        $method = makeMethod(['min_weight_grams' => 1000]);

        expect(fn() => calculator()->calculate($method, 500, 100000))
            ->toThrow(ShippingMethodUnavailableException::class);
    });

    it('throws when cart weight exceeds max_weight_grams', function () {
        $method = makeMethod(['max_weight_grams' => 5000]);

        expect(fn() => calculator()->calculate($method, 6000, 100000))
            ->toThrow(ShippingMethodUnavailableException::class);
    });

    it('accepts weight exactly at min boundary', function () {
        $method = makeMethod(['min_weight_grams' => 1000]);

        $quote = calculator()->calculate($method, 1000, 100000);

        expect($quote)->not->toBeNull();
    });

    it('accepts weight exactly at max boundary', function () {
        $method = makeMethod(['max_weight_grams' => 5000]);

        $quote = calculator()->calculate($method, 5000, 100000);

        expect($quote)->not->toBeNull();
    });

    it('accepts any weight when no constraints set', function () {
        $method = makeMethod(['min_weight_grams' => null, 'max_weight_grams' => null]);

        $quote = calculator()->calculate($method, 999999, 100000);

        expect($quote)->not->toBeNull();
    });

});

// ---------------------------------------------------------------------------
// Unavailable / unsupported
// ---------------------------------------------------------------------------

describe('ManualShippingCalculator — Exceptions', function () {

    it('throws ShippingMethodUnavailableException when method is inactive', function () {
        $method = makeMethod(['is_active' => false]);

        expect(fn() => calculator()->calculate($method, 0, 100000))
            ->toThrow(ShippingMethodUnavailableException::class);
    });

    it('throws ShippingMethodNotSupportedException for weight_zone type', function () {
        $method = makeMethod(['calculation_type' => ShippingCalculationType::WeightZone]);

        expect(fn() => calculator()->calculate($method, 0, 100000))
            ->toThrow(ShippingMethodNotSupportedException::class);
    });

});
