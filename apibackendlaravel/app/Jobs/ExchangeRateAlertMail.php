<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ExchangeRateAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $reason,
        public readonly array $context = [],
    ) {}

    public function build(): self
    {
        return $this
            ->subject('هشدار: مشکل در به‌روزرسانی نرخ ارز')
            ->view('emails.exchange-rate-alert')
            ->with(['reason' => $this->reason, 'context' => $this->context]);
    }
}
