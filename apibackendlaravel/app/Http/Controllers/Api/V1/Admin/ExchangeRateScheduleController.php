<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Pricing\StoreExchangeRateScheduleRequest;
use App\Http\Requests\Api\V1\Pricing\UpdateExchangeRateScheduleRequest;
use App\Http\Resources\ExchangeRateScheduleResource;
use App\Models\ExchangeRateSchedule;
use Illuminate\Http\Request;

class ExchangeRateScheduleController extends Controller
{
    /**
     * لیست زمان‌بندی‌های دریافت خودکار نرخ - فعال و قطع شده، تا ادمین همه را ببیند.
     */
    public function index(Request $request)
    {
        abort_unless($request->user()?->can('exchange-rates.manage'), 403);

        return ExchangeRateScheduleResource::collection(
            ExchangeRateSchedule::query()->latest()->get()
        );
    }

    public function store(StoreExchangeRateScheduleRequest $request)
    {
        $schedule = ExchangeRateSchedule::create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
        ]);

        return (new ExchangeRateScheduleResource($schedule))->response()->setStatusCode(201);
    }

    public function update(UpdateExchangeRateScheduleRequest $request, ExchangeRateSchedule $schedule)
    {
        $schedule->update($request->validated());

        return new ExchangeRateScheduleResource($schedule->fresh());
    }

    public function destroy(Request $request, ExchangeRateSchedule $schedule)
    {
        abort_unless($request->user()?->can('exchange-rates.manage'), 403);

        $schedule->delete();

        return response()->json(['message' => 'زمان‌بندی حذف شد.']);
    }
}
