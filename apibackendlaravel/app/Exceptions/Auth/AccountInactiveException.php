<?php
// app/Exceptions/Auth/AccountInactiveException.php

namespace App\Exceptions\Auth;

use App\Exceptions\ApiException;

class AccountInactiveException extends ApiException
{
    public function __construct()
    {
        parent::__construct('Account is inactive.');
    }

    public function errorCode(): string { return 'ACCOUNT_INACTIVE'; }
    public function statusCode(): int { return 403; }
    public function userMessage(): string
    {
        return 'حساب کاربری غیرفعال است.';
    }
}