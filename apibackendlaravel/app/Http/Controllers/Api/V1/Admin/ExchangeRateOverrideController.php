<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Pricing\ManualExchangeRateOverrideRequest;
use App\Models\ExchangeRate;
use App\Services\Pricing\PriceProposalService;
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
}
