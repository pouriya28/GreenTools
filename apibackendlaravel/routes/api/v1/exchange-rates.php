<?php

use App\Http\Controllers\Api\V1\Admin\ExchangeRateOverrideController;
use App\Http\Controllers\Api\V1\Admin\ExchangeRateScheduleController;
use Illuminate\Support\Facades\Route;

// جدا از routes/api/v1/pricing.php طبق تصمیم تایید‌شده: این فایل فقط مسیرهای
// «مدیریت نرخ ارز» (ورود دستی، دریافت آنی از API، تایید، زمان‌بندی خودکار) را دارد
// و از permission مجزای exchange-rates.manage استفاده می‌کند - کاملاً مستقل از
// prices.review که فقط برای بازبینی پیشنهاد قیمت محصولات است.
Route::middleware([
    'auth:sanctum',
    'staff.access',
    'account.active',
    'throttle:120,1',
])
    ->prefix('admin/exchange-rates')
    ->group(function () {

        // نرخ فعلی/آخرین ثبت‌شده - برای دیالوگ ورود دستی و نمایش وضعیت.
        Route::get('current', [ExchangeRateOverrideController::class, 'current']);

        // تایید جدیدترین نرخ، کاملاً مستقل از بازبینی پیشنهادهای قیمت محصولات
        // (حتی اگر batch صفر پیشنهاد دارد - مثلاً هنوز محصول دلاری‌ای ثبت نشده).
        Route::post('confirm', [ExchangeRateOverrideController::class, 'confirmCurrent']);

        // Override دستی نرخ دلار - throttle سخت‌گیرانه‌تر طبق تصمیم تایید‌شده.
        Route::post('override', [ExchangeRateOverrideController::class, 'store'])
            ->middleware('throttle:5,60');

        // دریافت آنی نرخ از API نوسان با زدن یک دکمه - throttle جدا چون سرویس خارجی صدا زده می‌شود.
        Route::post('fetch-now', [ExchangeRateOverrideController::class, 'fetchNow'])
            ->middleware('throttle:10,60');

        // زمان‌بندی خودکار دریافت نرخ (روزانه/هفتگی/ماهانه با روزهای دلخواه).
        Route::get('schedules', [ExchangeRateScheduleController::class, 'index']);
        Route::post('schedules', [ExchangeRateScheduleController::class, 'store']);
        Route::patch('schedules/{schedule}', [ExchangeRateScheduleController::class, 'update']);
        Route::delete('schedules/{schedule}', [ExchangeRateScheduleController::class, 'destroy']);
    });
