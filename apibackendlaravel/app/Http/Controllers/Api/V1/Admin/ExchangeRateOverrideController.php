<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Pricing\ManualExchangeRateOverrideRequest;
use App\Models\ExchangeRate;
use App\Services\Pricing\Exceptions\ExchangeRateFetchException;
use App\Services\Pricing\ExchangeRateProviderInterface;
use App\Services\Pricing\PriceProposalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExchangeRateOverrideController extends Controller
{
    public function __construct(private PriceProposalService $proposalService) {}

    /**
     * Override دستی نرخ دلار توسط ادمین. طبق تصمیم تایید‌شده این مسیر قیمت‌ها
     * را مستقیم اعمال نمی‌کند - فقط یک ExchangeRate جدید با source=manual_admin
     * می‌سازد و از همان مسیر Proposal→Review رد می‌شود که چک هفتگی خودکار هم
     * از آن استفاده می‌کند (بدون مسیر جدا).
     */
    public function store(ManualExchangeRateOverrideRequest $request)
    {
        [$rate, $batchId] = DB::transaction(function () use ($request) {
            $rate = ExchangeRate::create([
                'rate' => $request->validated('rate'),
                'status' => 'pending_review',
                'fetched_at' => now(),
                'source' => 'manual_admin',
                'reason' => $request->validated('reason'),
                'requested_by' => $request->user()->id,
            ]);

            $batchId = $this->proposalService->createBatchForRate($rate);

            return [$rate, $batchId];
        });

        return response()->json([
            'message' => 'نرخ دستی ثبت شد و پیشنهادهای قیمت جدید برای بازبینی ساخته شدند.',
            'exchange_rate_id' => $rate->id,
            'batch_id' => $batchId,
        ], 201);
    }

    /**
     * دریافت آنی نرخ از API نوسان با زدن یک دکمه (بدون نیاز به تایپ دستی نرخ).
     * همانند override دستی، نرخ فوراً applied نمی‌شود - source=manual_fetch در وضعیت
     * pending_review ثبت می‌شود و منتظر تایید ادمین (confirmCurrent یا بازبینی پیشنهاد) می‌ماند.
     */
    public function fetchNow(Request $request, ExchangeRateProviderInterface $provider)
    {
        abort_unless($request->user()?->can('exchange-rates.manage'), 403);

        try {
            $fetched = $provider->fetch();
        } catch (ExchangeRateFetchException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        [$rate, $batchId] = DB::transaction(function () use ($request, $fetched) {
            $rate = ExchangeRate::create([
                'rate' => $fetched->rate,
                'status' => 'pending_review',
                'fetched_at' => $fetched->fetchedAt,
                'source' => 'manual_fetch',
                'reason' => 'دریافت آنی نرخ از API نوسان با دکمه توسط ادمین.',
                'requested_by' => $request->user()->id,
                'raw_response' => $fetched->rawResponse,
            ]);

            $batchId = $this->proposalService->createBatchForRate($rate);

            return [$rate, $batchId];
        });

        return response()->json([
            'message' => 'نرخ از API دریافت شد و در انتظار تایید ادمین قرار گرفت.',
            'exchange_rate_id' => $rate->id,
            'batch_id' => $batchId,
            'rate' => $rate->rate,
        ], 201);
    }

    /**
     * جدیدترین نرخ ثبت‌شده (صرف نظر از status) را برمی‌گرداند تا در دیالوگ
     * override دستی به‌عنوان مقدار پیش‌فرض/مرجع نمایش داده شود و ادمین در
     * صورت نیاز آن را اصلاح کند.
     */
    public function current()
    {
        $rate = ExchangeRate::query()->latest('fetched_at')->first();

        if (! $rate) {
            return response()->json(['data' => null]);
        }

        return response()->json([
            'data' => [
                'rate' => $rate->rate,
                'status' => $rate->status,
                'source' => $rate->source,
                'fetched_at' => optional($rate->fetched_at)->toIso8601String(),
            ],
        ]);
    }

    /**
     * Bug fix: پیش‌تر تنها راه رسیدن نرخ ارز به وضعیت applied، تایید یکی از
     * پیشنهادهای قیمت محصولات بود (PriceProposalService::approveOne). اگر
     * هنوز هیچ محصول دلاری‌ای ثبت نشده باشد، batch صفر پیشنهاد دارد و نرخ
     * هرگز applied نمی‌شود. این اکشن، تایید نرخ ارز را کاملاً مستقل از
     * بازبینی پیشنهادهای قیمت محصولات می‌کند؛ ادمین می‌تواند جدیدترین نرخ را
     * مستقیماً تایید کند، حتی وقتی صفر یا چند پیشنهاد برایش وجود دارد. permission
     * مستقل exchange-rates.manage می‌خواهد (نه prices.review) طبق تصمیم تایید‌شده
     * جداسازی مدیریت نرخ ارز از بازبینی قیمت محصولات.
     */
    public function confirmCurrent(Request $request)
    {
        abort_unless($request->user()?->can('exchange-rates.manage'), 403);

        $rate = ExchangeRate::query()->latest('fetched_at')->first();

        if (! $rate) {
            return response()->json(['message' => 'هیچ نرخ ارزی ثبت نشده است.'], 404);
        }

        if ($rate->status !== 'applied') {
            $rate->update(['status' => 'applied']);
        }

        return response()->json([
            'message' => 'نرخ ارز تایید شد و به‌عنوان نرخ فعال برای قیمت‌گذاری محصولات جدید استفاده می‌شود.',
            'data' => [
                'id' => $rate->id,
                'rate' => $rate->rate,
                'status' => $rate->status,
                'source' => $rate->source,
                'fetched_at' => optional($rate->fetched_at)->toIso8601String(),
            ],
        ]);
    }
}
