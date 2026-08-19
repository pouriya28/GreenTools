<?php
// app/Exceptions/Auth/RefreshTokenExpiredException.php

namespace App\Exceptions\Auth;

use App\Exceptions\ApiException;

class RefreshTokenExpiredException extends ApiException
{
    public function __construct()
    {
        parent::__construct('Refresh token has expired.');
    }

    public function errorCode(): string { return 'REFRESH_TOKEN_EXPIRED'; }
    public function statusCode(): int { return 401; }
    public function userMessage(): string
    {
        return 'رفرش توکن منقضی شده است. لطفاً دوباره وارد شوید.';
    }
}