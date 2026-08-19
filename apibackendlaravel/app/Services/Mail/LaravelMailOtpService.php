<?php

namespace App\Services\Mail;

use App\Mail\OtpCodeMail;
use Illuminate\Support\Facades\Mail;

class LaravelMailOtpService implements MailServiceInterface
{
    public function sendOtp(string $email, string $code): bool
    {
        Mail::to($email)->send(new OtpCodeMail($code));

        return true;
    }
}
