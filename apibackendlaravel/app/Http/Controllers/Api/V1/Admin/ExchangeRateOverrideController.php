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
    // Bug fix: fetchNow() fetched an external rate and created proposals
    // without checking it against a sane range at all, unlike the manual
    // override path (ManualExchangeRateOverrideRequest applies
    // services.navasan.min_sane_rate/max_sane_rate). A corrupted or buggy API
    // response could otherwise slip a garbage rate straight into
    // pending_review with real proposals attached, and an admin might trust
    // an "official API fetch" enough to approve it without noticing. Reusing
    // the exact same config keys/fallbacks keeps both entry points to the
    // same untrusted external data consistent.
    private const FALLBACK_MIN_SANE_RATE = 1;
    private const FALLBACK_MAX_SANE_RATE = 999999999;

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

        // Bug fix: apply the same sane-range guard used by the manual override
        // form to this external fetch, before anything is written to the
        // database. Without this, a broken/compromised upstream API response
        // could create a full batch of price proposals off a nonsensical rate.
        $min = (float) (config('services.navasan.min_sane_rate') ?? self::FALLBACK_MIN_SANE_RATE);
        $max = (float) (config('services.navasan.max_sane_rate') ?? self::FALLBACK_MAX_SANE_RATE);

        if ($fetched->rate < $min || $fetched->rate > $max) {
            return response()->json([
                'message' => 'نرخ دریافت‌شده از API خارج از بازه‌ی منطقی مجاز است و ذخیره نشد. لطفاً بعداً دوباره تلاش کنید یا نرخ را دستی وارد کنید.',
            ], 422);
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
     * جدیدترین نرخ ثبت‌شده را برمی‌گرداند تا در دیالوگ override دستی به‌عنوان
     * مقدار پیش‌فرض/مرجع نمایش داده شود و ادمین در صورت نیاز آن را اصلاح کند.
     *
     * Bug fix (missing authorization): این متد، برخلاف بقیه‌ی متدهای همین
     * کنترلر، هیچ چک permission نداشت و فقط به میدل‌ور عمومی staff.access
     * تکیه می‌کرد - یعنی هر کارمند وارد‌شده‌ای (نه فقط کسی که
     * exchange-rates.manage دارد) می‌توانست نرخ و منبع آن را ببیند. برای
     * سازگاری با بقیه‌ی endpointها و اصل کمترین دسترسی، همان چک اضافه شد.
     *
     * Bug fix (rejected rate leaking back in): پیش‌تر این کوئری صرفاً
     * جدیدترین رکورد را صرف‌نظر از status برمی‌گرداند. اگر آخرین نرخ ثبت‌شده
     * توسط ادمین به‌طور کامل رد شده باشد (تمام پیشنهادهای batch آن reject شده،
     * نگاه کنید به PriceProposalService::rejectOne)، نباید آن را به‌عنوان
     * مرجع/پیش‌فرض نشان دهیم.
     */
    public function current(Request $request)
    {
        abort_unless($request->user()?->can('exchange-rates.manage'), 403);

        $rate = ExchangeRate::query()
            ->where('status', '!=', 'rejected')
            ->latest('fetched_at')
            ->first();

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
     *
     * Bug fix (این نسخه): مثل current()، دیگر نرخی که کامل reject شده را
     * "جدیدترین" حساب نمی‌کند - وگرنه یک ادمین می‌توانست با زدن این دکمه (مثلاً
     * هنگام رفع خطای "نرخ ارز ثبت نشده" هنگام افزودن محصول جدید) به‌اشتباه
     * همان نرخی را دوباره فعال کند که تیم قبلاً آگاهانه رد کرده بود.
     */
    public function confirmCurrent(Request $request)
    {
        abort_unless($request->user()?->can('exchange-rates.manage'), 403);

        $rate = ExchangeRate::query()
            ->where('status', '!=', 'rejected')
            ->latest('fetched_at')
            ->first();

        if (! $rate) {
            return response()->json(['message' => 'هیچ نرخ ارز قابل تاییدی ثبت نشده است.'], 404);
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
