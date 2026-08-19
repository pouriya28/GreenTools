<?php

namespace App\Services\Pricing;

use App\Mail\ExchangeRateAlertMail;
use App\Mail\PriceProposalReviewMail;
use App\Models\ExchangeRate;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ExchangeRateAlertNotifier
{
    public function notify(string $reason, array $context = []): void
    {
        $recipients = $this->adminRecipientEmails();

        if (empty($recipients)) {
            Log::warning('exchange_rate.alert_not_sent_no_recipient', ['reason' => $reason]);

            return;
        }

        Mail::to($recipients)->queue(new ExchangeRateAlertMail($reason, $context));
    }

    /**
     * اطلاع‌رسانی «آماده‌ی بررسی» - هم برای چک هفتگی خودکار و هم override
     * دستی ادمین. طبق تصمیم تایید‌شده همیشه ارسال می‌شود، صرف نظر از اینکه
     * anomaly باشد یا نه؛ فقط عنوان و لحن پیام فرق می‌کند. CSV قیمت‌های
     * قدیم/جدید همیشه پیوست می‌شود (تصمیم تایید‌شده شماره ۴ درخواست اولیه).
     */
    public function notifyPendingReview(
        ExchangeRate $rate,
        string $batchId,
        bool $isAnomaly,
        ?float $changePercent,
        string $csv,
    ): void {
        $recipients = $this->adminRecipientEmails();

        if (empty($recipients)) {
            Log::warning('exchange_rate.pending_review_alert_not_sent_no_recipient', ['batch_id' => $batchId]);

            return;
        }

        Mail::to($recipients)->queue(
            new PriceProposalReviewMail($rate, $batchId, $isAnomaly, $changePercent, $csv)
        );
    }

    /**
     * طبق تصمیم تایید‌شده، گیرنده‌های ایمیل باید همه‌ی کاربران با نقش ادمین
     * باشند - نه فقط یک آدرس ثابت در config. اگر به هر دلیل هیچ کاربر
     * ادمینی پیدا نشد (مثلاً هنوز نقشی ست نشده یا پکیج نقش‌ها فرق دارد)، به
     * config('alerts.admin_email') قدیمی به‌عنوان fallback برمی‌گردیم تا هیچ
     * هشدار مهمی گم نشود.
     */
    private function adminRecipientEmails(): array
    {
        try {
            $emails = User::role('admin')->pluck('email')->filter()->values()->all();
        } catch (\Throwable $e) {
            Log::warning('exchange_rate.admin_role_lookup_failed', ['message' => $e->getMessage()]);
            $emails = [];
        }

        if (! empty($emails)) {
            return $emails;
        }

        $fallback = config('alerts.admin_email');

        return $fallback ? [$fallback] : [];
    }
}
