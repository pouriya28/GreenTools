<?php

namespace App\Services\Sms;

interface SmsServiceInterface
{
    public function sendOtp(string $phone, string $code): bool;
}