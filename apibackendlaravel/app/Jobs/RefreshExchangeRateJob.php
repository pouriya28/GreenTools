<?php

namespace App\Jobs;

use App\Models\ExchangeRate;
use App\Services\Pricing\Exceptions\ExchangeRateFetchException;
use App\Services\Pricing\ExchangeRateAlertNotifier;
use App\Services\Pricing\ExchangeRateProviderInterface;
use App\Services\Pricing\PriceProposalCsvExporter;
use App\Services\Pricing\PriceProposalService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class RefreshExchangeRateJob implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function uniqueId(): string
    {
        return 'refresh-exchange-rate';
    }

    public int $uniqueFor = 3600;

    public int $tries = 1;

    /**
     * طبق تصمیم تایید‌شده، این جاب دیگر قیمت هیچ محصولی را مستقیم تغییر
     * نمی‌دهد (RecalculateProductPricesJob دیگر از اینجا dispatch نمی‌شود).
     * چک هفتگی - چه عادی و چه anomaly - فقط یک ExchangeRate با
     * status=pending_review می‌سازد و از همان PriceProposalService که
     * override دستی ادمین هم استفاده می‌کند، پیشنهادهای قیمت می‌سازد.
     * اعمال واقعی قیمت روی محصولات فقط بعد از تایید ادمین (approveOne /
     * approveBatch) اتفاق می‌افتد. ایمیل + CSV هم صرف نظر از anomaly همیشه
     * ارسال می‌شود؛ فقط لحن/عنوان پیام فرق می‌کند.
     */
    public function handle(
        ExchangeRateProviderInterface $provider,
        ExchangeRateAlertNotifier $alerter,
        PriceProposalService $proposalService,
        PriceProposalCsvExporter $csvExporter,
    ): void {
        try {
            $fetched = $provider->fetch();
        } catch (ExchangeRateFetchException $e) {
            Log::error('exchange_rate.refresh_failed', ['message' => $e->getMessage()]);
            $alerter->notify('دریافت نرخ ارز از سرویس خارجی ناموفق بود.', ['error' => $e->getMessage()]);

            return;
        }

        $lastApplied = ExchangeRate::applied()->latest('fetched_at')->first();
        $maxChangePercent = config('services.navasan.max_change_percent');
        $changePercent = null;
        $isAnomaly = false;

        if ($lastApplied) {
            $changePercent = abs($fetched->rate - (float) $lastApplied->rate) / (float) $lastApplied->rate * 100;
            $isAnomaly = $changePercent > $maxChangePercent;
        }

        $note = $isAnomaly
            ? sprintf(
                'تغییر %.2f%% نسبت به نرخ قبلی، بیشتر از حد مجاز (%s%%) - نیاز به بررسی دقیق قبل از تایید',
                $changePercent,
                $maxChangePercent,
            )
            : 'بررسی هفتگی خودکار - در انتظار تایید ادمین';

        $rate = ExchangeRate::create([
            'rate' => $fetched->rate,
            'source' => 'scheduled',
            'fetched_at' => $fetched->fetchedAt,
            'status' => 'pending_review',
            'note' => $note,
            'raw_response' => $fetched->rawResponse,
        ]);

        Log::info('exchange_rate.pending_review', [
            'rate_id' => $rate->id,
            'rate' => $rate->rate,
            'is_anomaly' => $isAnomaly,
            'change_percent' => $changePercent,
        ]);

        $batchId = $proposalService->createBatchForRate($rate);
        $csv = $csvExporter->exportForBatch($batchId);

        // طبق تصمیم تایید‌شده: این ایمیل صرف نظر از anomaly همیشه ارسال می‌شود.
        $alerter->notifyPendingReview($rate, $batchId, $isAnomaly, $changePercent, $csv);
    }
}
