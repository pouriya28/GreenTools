<?php

namespace App\Exceptions\Auth;

use App\Exceptions\ApiException;

class InvalidOperationPasswordException extends ApiException
{
    public function errorCode(): string
    {
        return 'INVALID_OPERATION_PASSWORD';
    }

    public function statusCode(): int
    {
        return 422;
    }

    public function userMessage(): string
    {
        return 'رمز تأیید عملیات اشتباه است.';
    }
}