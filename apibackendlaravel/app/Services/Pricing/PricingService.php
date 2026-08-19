<?php

namespace App\Services\Pricing;

use App\Models\ExchangeRate;
use App\Models\Product;

class PricingService
{
    public function computeTomanPrice(Product $product, ExchangeRate $rate): int
    {
        $computed = (int) round(((float) $product->price_usd) * ((float) $rate->rate));
        $current = (int) ($product->price_toman ?? 0);

        return max($computed, $current);
    }

    /**
     * تبدیل مستقیم دلار به تومان، بدون محافظت max() — فقط برای زمانی که
     * خودِ ادمین دستی price_usd رو تغییر می‌ده. محافظت «قیمت هرگز خودکار
     * پایین نیاد» فقط باید برای بازمحاسبه‌ی خودکار هفتگی اعمال بشه.
     */
    public function convertUsdToToman(float $priceUsd, ExchangeRate $rate): int
    {
        return (int) round($priceUsd * (float) $rate->rate);
    }

    public function computeFinalPrice(Product $product): int
    {
        if (! $this->hasActiveDiscount($product)) {
            return $product->price_toman;
        }

        $discounted = $product->discount_type === \App\Enums\DiscountType::Percent
            ? (int) round($product->price_toman * (1 - $product->discount_value / 100))
            : $product->price_toman - $product->discount_value;

        return max(0, min($discounted, $product->price_toman));
    }

    public function hasActiveDiscount(Product $product): bool
    {
        if (! $product->discount_type || ! $product->discount_value) {
            return false;
        }

        $now = now();

        if ($product->discount_starts_at && $now->lt($product->discount_starts_at)) {
            return false;
        }

        if ($product->discount_ends_at && $now->gt($product->discount_ends_at)) {
            return false;
        }

        return true;
    }

    public function assertDiscountValid(?string $discountType, ?int $discountValue, int $priceToman): void
    {
        if (! $discountType || $discountValue === null) {
            return;
        }

        if ($discountValue < 0) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'discount_value' => 'مقدار تخفیف نمی‌تواند منفی باشد.',
            ]);
        }

        if ($discountType === 'percent' && $discountValue > 100) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'discount_value' => 'درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد.',
            ]);
        }

        if ($discountType === 'fixed' && $discountValue > $priceToman) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'discount_value' => 'مبلغ تخفیف نمی‌تواند بیشتر از قیمت محصول باشد.',
            ]);
        }
    }
}
