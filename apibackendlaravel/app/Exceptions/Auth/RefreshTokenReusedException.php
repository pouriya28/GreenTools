<?php
// app/Exceptions/Auth/RefreshTokenReusedException.php

namespace App\Exceptions\Auth;

use App\Exceptions\ApiException;
use Illuminate\Support\Facades\Log;

/**
 * توکن رفرشِ قبلاً مصرف‌شده، خارج از grace window دوباره استفاده شده.
 * این یه رخداد امنیتیه (نشونه‌ی احتمالی سرقت توکن)، نه یه خطای معمولی کاربر.
 */
class RefreshTokenReusedException extends ApiException
{
    public function __construct(
        private readonly int $userId,
        private readonly string $familyId,
    ) {
        parent::__construct('Refresh token reuse detected outside grace window.');
    }

    public function errorCode(): string { return 'REFRESH_TOKEN_REUSED'; }
    public function statusCode(): int { return 401; }
    public function userMessage(): string
    {
        return 'به دلایل امنیتی نشست شما باطل شد. لطفاً دوباره وارد شوید.';
    }

    public function report(): void
    {
        Log::critical('Refresh token reuse detected — possible token theft', [
            'user_id' => $this->userId,
            'family_id' => $this->familyId,
        ]);
    }
}