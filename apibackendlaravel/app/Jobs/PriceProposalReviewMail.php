<?php

namespace App\Mail;

use App\Models\ExchangeRate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PriceProposalReviewMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly ExchangeRate $rate,
        public readonly string $batchId,
        public readonly bool $isAnomaly,
        public readonly ?float $changePercent,
        public readonly string $csv,
    ) {}

    /**
     * عمداً بدون blade view نوشته شده (->html مستقیم) تا وابسته به فایل
     * template ای که برای من ارسال نشده نباشد. اگر می‌خوای با ظاهر ایمیل‌های
     * دیگه پروژه هماهنگ باشه، بگو تا با یه view واقعی جایگزینش کنم.
     */
    public function build(): self
    {
        $subject = $this->isAnomaly
            ? '⚠️ هشدار: تغییر غیرعادی نرخ ارز - نیاز به بررسی فوری قیمت‌ها'
            : 'قیمت‌های پیشنهادی جدید در انتظار بررسی';

        $changeLine = $this->changePercent !== null
            ? sprintf('تغییر نسبت به نرخ قبلی: %.2f%%', $this->changePercent)
            : 'این اولین نرخ ثبت‌شده است (نرخ قبلی برای مقایسه وجود ندارد).';

        $html = sprintf(
            '<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif">'
                .'<p>نرخ جدید دلار (%s) دریافت شد و پیشنهادهای قیمت جدید برای محصولات ساخته شد.</p>'
                .'<p>%s</p>'
                .'<p>%s</p>'
                .'<p>برای بررسی، تایید یا رد این پیشنهادها به پنل ادمین مراجعه کنید. فایل CSV پیوست شامل قیمت قدیم و جدید همه‌ی محصولات این batch است.</p>'
                .'<p>شناسه بررسی (batch): %s</p>'
            .'</div>',
            e((string) $this->rate->rate),
            e($changeLine),
            $this->isAnomaly
                ? 'این تغییر بیشتر از حد آستانه‌ی مجاز است، لطفاً قبل از تایید با دقت بیشتری بررسی کنید.'
                : 'این یک بررسی هفتگی معمول است.',
            e($this->batchId),
        );

        return $this
            ->subject($subject)
            ->html($html)
            ->attachData($this->csv, "price-proposals-{$this->batchId}.csv", [
                'mime' => 'text/csv',
            ]);
    }
}
