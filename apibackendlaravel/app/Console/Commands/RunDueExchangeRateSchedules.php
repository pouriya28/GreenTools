<?php

namespace App\Console\Commands;

use App\Jobs\RefreshExchangeRateJob;
use App\Models\ExchangeRateSchedule;
use Illuminate\Console\Command;

class RunDueExchangeRateSchedules extends Command
{
    protected $signature = 'exchange-rates:run-due-schedules';

    protected $description = 'بررسی زمان‌بندی‌های فعال نرخ ارز و dispatch کردن RefreshExchangeRateJob برای هرکدام که الان موعدشان است.';

    public function handle(): int
    {
        $now = now();

        ExchangeRateSchedule::query()->active()->get()->each(function (ExchangeRateSchedule $schedule) use ($now) {
            if (! $schedule->isDueAt($now)) {
                return;
            }

            // جلوگیری از اجرای دوباره در همان دقیقه (اگر scheduler به هر دلیلی بیشتر
            // از یک بار در همان بازه اجرا شود) یا در همان روز.
            if (
                $schedule->last_triggered_at
                && $schedule->last_triggered_at->isSameDay($now)
                && $schedule->last_triggered_at->format('H:i') === $now->format('H:i')
            ) {
                return;
            }

            RefreshExchangeRateJob::dispatch();
            $schedule->update(['last_triggered_at' => $now]);

            $this->info("Schedule #{$schedule->id} triggered RefreshExchangeRateJob at {$now->toDateTimeString()}.");
        });

        return self::SUCCESS;
    }
}
