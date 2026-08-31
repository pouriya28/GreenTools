<?php

use App\Jobs\ExpireInventoryReservationsJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// نرخ ارز دیگه با یک زمان‌بندی ثابت توی کد آپدیت نمی‌شه؛ حالا ادمین از پنل
// هر چند زمان‌بندی دلخواه (روزانه/هفتگی/ماهانه، با انتخاب روزهای دلخواه)
// می‌سازه و این دستور هر دقیقه چک می‌کنه کدوم الان باید اجرا بشه.
Schedule::command('exchange-rates:run-due-schedules')
    ->everyMinute()
    ->withoutOverlapping()
    ->onOneServer();

// هر دقیقه بررسی می‌کند که آیا رزرو موجودی منقضی‌شده‌ای وجود دارد؛ در صورت
// وجود، سفارش‌های در انتظار پرداخت مرتبط را لغو و موجودی رزرو‌شده را آزاد
// می‌کند. withoutOverlapping/onOneServer هم‌الگو با job نرخ ارز، چون این
// Job هم تراکنش‌های نوشتاری روی order/inventory_reservations انجام می‌دهد
// و اجرای هم‌زمان چند نسخه‌ی آن می‌تواند باعث race condition شود.
Schedule::job(new ExpireInventoryReservationsJob)
    ->everyMinute()
    ->withoutOverlapping()
    ->onOneServer();