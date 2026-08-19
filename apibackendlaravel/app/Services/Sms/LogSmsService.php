<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Log;

class LogSmsService implements SmsServiceInterface
{
    public function sendOtp(string $phone, string $code): bool
    {
        Log::info("OTP Code for {$phone}: {$code}");
        return true;
    }
}