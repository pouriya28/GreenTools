<?php

use App\Jobs\RefreshExchangeRateJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// هر هفته یک‌بار (دوشنبه‌ها ساعت ۳ بامداد - ترافیک کم) نرخ دلار رو بگیر و قیمت‌ها رو بازمحاسبه کن
Schedule::job(new RefreshExchangeRateJob())
    ->weeklyOn(1, '03:00')
    ->withoutOverlapping()
    ->onOneServer(); // اگه چند وُرکر/سرور داری، فقط یکیشون اجرا کنه