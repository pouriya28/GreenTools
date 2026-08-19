<?php

namespace App\Enums;

enum OtpChannel: string
{
    case Sms = 'phone';
    case Mail = 'email';
}
