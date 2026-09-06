<?php

namespace App\Exceptions\Auth;

use App\Exceptions\ApiException;

class OperationVerificationRequiredException extends ApiException
{
    public function errorCode(): string
    {
        return 'OPERATION_VERIFICATION_REQUIRED';
    }

    public function statusCode(): int
    {
        return 403;
    }

    public function userMessage(): string
    {
        return 'برای انجام این عملیات ابتدا باید رمز تأیید عملیات را وارد کنید.';
    }
}