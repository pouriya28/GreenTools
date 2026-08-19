<?php

namespace App\Services\Pricing;

use App\Services\Pricing\DTOs\FetchedRate;
use App\Services\Pricing\Exceptions\ExchangeRateFetchException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NavasanExchangeRateProvider implements ExchangeRateProviderInterface
{
    public function fetch(): FetchedRate
    {
        $apiKey = config('services.navasan.api_key');

        if (empty($apiKey)) {
            throw new ExchangeRateFetchException('کلید API نوسان تنظیم نشده است.');
        }

        $baseUrl = config('services.navasan.base_url');

        if (! str_starts_with($baseUrl, 'https://')) {
            // کلید API روی HTTP ساده رمزنگاری نمی‌شه و می‌تونه رو شبکه دیده بشه
            Log::warning('exchange_rate.insecure_endpoint', ['base_url' => $baseUrl]);
        }

        try {
            $response = Http::timeout(5)
                ->connectTimeout(3)
                // فقط رو خطای اتصال یا 5xx واقعی retry می‌کنیم، نه رو 4xx
                // (که تکرارش بی‌فایده‌ست، مثلاً کلید نامعتبر)
                ->retry(2, 300, function (\Throwable $exception) {
                    if ($exception instanceof ConnectionException) {
                        return true;
                    }

                    return $exception instanceof RequestException
                        && $exception->response->serverError();
                })
                ->get($baseUrl, ['api_key' => $apiKey])
                ->throw();
        } catch (ConnectionException $e) {
            Log::warning('exchange_rate.fetch_connection_failed', ['message' => $e->getMessage()]);
            throw new ExchangeRateFetchException('اتصال به سرویس نرخ ارز برقرار نشد.', previous: $e);
        } catch (RequestException $e) {
            Log::warning('exchange_rate.fetch_failed', ['status' => $e->response->status()]);
            throw new ExchangeRateFetchException("سرویس نرخ ارز پاسخ نامعتبر داد (HTTP {$e->response->status()}).", previous: $e);
        }

        $body = $response->json();
        $rateKey = config('services.navasan.usd_rate_key');

        if (! is_array($body) || ! isset($body[$rateKey]['value'])) {
            Log::warning('exchange_rate.unexpected_shape', ['body' => $response->body()]);
            throw new ExchangeRateFetchException('ساختار پاسخ سرویس نرخ ارز غیرمنتظره بود.');
        }

        $rawValue = $body[$rateKey]['value'];

        if (! is_numeric($rawValue)) {
            throw new ExchangeRateFetchException('مقدار نرخ دریافتی عددی نیست.');
        }

        $rate = (float) $rawValue;
        $min = config('services.navasan.min_sane_rate');
        $max = config('services.navasan.max_sane_rate');

        if ($rate < $min || $rate > $max) {
            Log::warning('exchange_rate.out_of_sane_bounds', ['rate' => $rate, 'min' => $min, 'max' => $max]);
            throw new ExchangeRateFetchException("نرخ دریافتی ({$rate}) خارج از بازه‌ی منطقی است.");
        }

        return new FetchedRate(
            rate: $rate,
            source: 'navasan',
            fetchedAt: new \DateTimeImmutable(),
            rawResponse: $response->body(),
        );
    }
}
