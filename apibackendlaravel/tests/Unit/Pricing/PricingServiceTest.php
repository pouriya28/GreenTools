<?php

use App\Enums\DiscountType;
use App\Models\ExchangeRate;
use App\Models\Product;
use App\Services\Pricing\PricingService;
use Illuminate\Support\Facades\DB;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeProductForPricing(float $priceUsd = 0, int $priceToman = 0, array $attrs = []): Product
{
    $product = Product::factory()->create(array_merge(['is_active' => true], $attrs));

    DB::table('products')->where('id', $product->id)->update([
        'price_usd'   => $priceUsd,
        'price_toman' => $priceToman,
    ]);

    return $product->refresh();
}

function makeRate(float $rate): ExchangeRate
{
    return ExchangeRate::create([
        'rate'       => $rate,
        'status'     => 'pending_review',
        'fetched_at' => now(),
        'source'     => 'manual_admin',
    ]);
}

// ---------------------------------------------------------------------------
// computeTomanPrice — price-floor protection
// ---------------------------------------------------------------------------

it('computeTomanPrice returns the computed price when it is higher than the current price', function (): void {
    $product = makeProductForPricing(priceUsd: 10.0, priceToman: 500_000);
    $rate    = makeRate(80_000); // 10 * 80_000 = 800_000 > 500_000

    $result = app(PricingService::class)->computeTomanPrice($product, $rate);

    expect($result)->toBe(800_000);
});

it('computeTomanPrice returns the current price when computed price would be lower (price-floor guard)', function (): void {
    // CRITICAL REGRESSION: automatic recalculation must NEVER decrease a
    // product's toman price. If the dollar rate drops, the price stays put.
    $product = makeProductForPricing(priceUsd: 10.0, priceToman: 900_000);
    $rate    = makeRate(70_000); // 10 * 70_000 = 700_000 < 900_000

    $result = app(PricingService::class)->computeTomanPrice($product, $rate);

    expect($result)->toBe(900_000);
});

it('computeTomanPrice returns the computed price when current price_toman is null/zero', function (): void {
    $product = makeProductForPricing(priceUsd: 5.0, priceToman: 0);
    $rate    = makeRate(60_000); // 5 * 60_000 = 300_000

    $result = app(PricingService::class)->computeTomanPrice($product, $rate);

    expect($result)->toBe(300_000);
});

it('computeTomanPrice rounds fractional toman values to nearest integer', function (): void {
    $product = makeProductForPricing(priceUsd: 1.0, priceToman: 0);
    $rate    = makeRate(75_333.5); // 1 * 75_333.5 = 75_333.5 → round → 75_334

    $result = app(PricingService::class)->computeTomanPrice($product, $rate);

    expect($result)->toBe(75_334);
});

// ---------------------------------------------------------------------------
// convertUsdToToman — direct conversion, NO price-floor
// ---------------------------------------------------------------------------

it('convertUsdToToman returns the direct conversion without price-floor protection', function (): void {
    // Used only when admin manually edits price_usd. Unlike computeTomanPrice,
    // this method must NOT apply the max() guard — the admin explicitly chose
    // a new USD value and the toman equivalent must reflect that exactly.
    $rate   = makeRate(80_000);
    $result = app(PricingService::class)->convertUsdToToman(5.0, $rate);

    expect($result)->toBe(400_000);
});

it('convertUsdToToman can return a value lower than the existing toman price', function (): void {
    // This is intentional — it differs from computeTomanPrice by design.
    $product = makeProductForPricing(priceUsd: 10.0, priceToman: 900_000);
    $rate    = makeRate(50_000);

    $result = app(PricingService::class)->convertUsdToToman(10.0, $rate);

    expect($result)->toBeLessThan($product->price_toman);
});

// ---------------------------------------------------------------------------
// computeFinalPrice — discounts
// ---------------------------------------------------------------------------

it('computeFinalPrice returns price_toman when there is no discount', function (): void {
    $product = makeProductForPricing(priceToman: 1_000_000);

    expect(app(PricingService::class)->computeFinalPrice($product))->toBe(1_000_000);
});

it('computeFinalPrice applies a percent discount correctly', function (): void {
    $product = makeProductForPricing(priceToman: 1_000_000, attrs: [
        'discount_type'  => DiscountType::Percent,
        'discount_value' => 20,
    ]);

    expect(app(PricingService::class)->computeFinalPrice($product))->toBe(800_000);
});

it('computeFinalPrice applies a fixed discount correctly', function (): void {
    $product = makeProductForPricing(priceToman: 1_000_000, attrs: [
        'discount_type'  => DiscountType::Fixed,
        'discount_value' => 150_000,
    ]);

    expect(app(PricingService::class)->computeFinalPrice($product))->toBe(850_000);
});

it('computeFinalPrice never returns a negative price', function (): void {
    $product = makeProductForPricing(priceToman: 100_000, attrs: [
        'discount_type'  => DiscountType::Fixed,
        'discount_value' => 999_999,
    ]);

    expect(app(PricingService::class)->computeFinalPrice($product))->toBe(0);
});

it('computeFinalPrice ignores a discount that has not started yet', function (): void {
    $product = makeProductForPricing(priceToman: 1_000_000, attrs: [
        'discount_type'       => DiscountType::Percent,
        'discount_value'      => 50,
        'discount_starts_at'  => now()->addDay(),
    ]);

    expect(app(PricingService::class)->computeFinalPrice($product))->toBe(1_000_000);
});

it('computeFinalPrice ignores an expired discount', function (): void {
    $product = makeProductForPricing(priceToman: 1_000_000, attrs: [
        'discount_type'    => DiscountType::Percent,
        'discount_value'   => 50,
        'discount_ends_at' => now()->subDay(),
    ]);

    expect(app(PricingService::class)->computeFinalPrice($product))->toBe(1_000_000);
});

it('computeFinalPrice applies an active discount within its date window', function (): void {
    $product = makeProductForPricing(priceToman: 1_000_000, attrs: [
        'discount_type'       => DiscountType::Percent,
        'discount_value'      => 10,
        'discount_starts_at'  => now()->subHour(),
        'discount_ends_at'    => now()->addHour(),
    ]);

    expect(app(PricingService::class)->computeFinalPrice($product))->toBe(900_000);
});

// ---------------------------------------------------------------------------
// assertDiscountValid
// ---------------------------------------------------------------------------

it('assertDiscountValid passes when discount is null', function (): void {
    expect(fn () => app(PricingService::class)->assertDiscountValid(null, null, 1_000_000))
        ->not->toThrow(\Exception::class);
});

it('assertDiscountValid throws when discount_value is negative', function (): void {
    expect(fn () => app(PricingService::class)->assertDiscountValid('percent', -1, 1_000_000))
        ->toThrow(\Illuminate\Validation\ValidationException::class);
});

it('assertDiscountValid throws when percent discount exceeds 100', function (): void {
    expect(fn () => app(PricingService::class)->assertDiscountValid('percent', 101, 1_000_000))
        ->toThrow(\Illuminate\Validation\ValidationException::class);
});

it('assertDiscountValid throws when fixed discount exceeds the product price', function (): void {
    expect(fn () => app(PricingService::class)->assertDiscountValid('fixed', 1_500_000, 1_000_000))
        ->toThrow(\Illuminate\Validation\ValidationException::class);
});

it('assertDiscountValid passes for a valid 100 percent discount', function (): void {
    expect(fn () => app(PricingService::class)->assertDiscountValid('percent', 100, 1_000_000))
        ->not->toThrow(\Exception::class);
});

it('assertDiscountValid passes for a fixed discount exactly equal to the price', function (): void {
    expect(fn () => app(PricingService::class)->assertDiscountValid('fixed', 1_000_000, 1_000_000))
        ->not->toThrow(\Exception::class);
});
