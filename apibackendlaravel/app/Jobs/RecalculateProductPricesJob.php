<?php

namespace App\Jobs;

use App\Models\ExchangeRate;
use App\Models\Product;
use App\Services\Pricing\PricingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RecalculateProductPricesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private int $exchangeRateId) {}

    public function handle(PricingService $pricingService): void
    {
        $rate = ExchangeRate::find($this->exchangeRateId);

        if (! $rate || $rate->status !== 'applied') {
            Log::warning('recalculate_prices.invalid_rate', ['exchange_rate_id' => $this->exchangeRateId]);

            return;
        }

        $updated = 0;

        Product::query()
            ->where('price_usd', '>', 0)
            ->chunkById(200, function ($products) use ($pricingService, $rate, &$updated) {
                DB::transaction(function () use ($products, $pricingService, $rate, &$updated) {
                    foreach ($products as $product) {
                        $newPrice = $pricingService->computeTomanPrice($product, $rate);

                        if ($newPrice !== $product->price_toman) {
                            $product->update(['price_toman' => $newPrice]);
                            $updated++;
                        }
                    }
                });
            });

        Log::info('recalculate_prices.done', ['exchange_rate_id' => $rate->id, 'updated_count' => $updated]);
    }
}