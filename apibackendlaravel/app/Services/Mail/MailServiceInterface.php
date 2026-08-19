<?php

namespace App\Services\Mail;

interface MailServiceInterface
{
    public function sendOtp(string $email, string $code): bool;
}
