<?php
// app/Exceptions/Auth/RefreshTokenInvalidException.php

namespace App\Exceptions\Auth;

use App\Exceptions\ApiException;

class RefreshTokenInvalidException extends ApiException
{
    public function __construct()
    {
        parent::__construct('Refresh token is missing or invalid.');
    }

    public function errorCode(): string { return 'REFRESH_TOKEN_INVALID'; }
    public function statusCode(): int { return 401; }
    public function userMessage(): string
    {
        return 'رفرش توکن نامعتبر است. لطفاً دوباره وارد شوید.';
    }
}