<?php

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
    ->onOneServer(); // اگه چند وُرکر/سرور داری، فقط یکیشون اجرا کنه