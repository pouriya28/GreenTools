<?php

namespace App\Exceptions\Cart;

use App\Exceptions\ApiException;

class CartVersionConflictException extends ApiException
{
    public function __construct(int $currentVersion)
    {
        parent::__construct('Cart version conflict.');
        $this->withContext(['current_version' => $currentVersion]);
    }

    public function errorCode(): string
    {
        return 'CART_VERSION_CONFLICT';
    }

    public function statusCode(): int
    {
        return 409;
    }

    public function userMessage(): string
    {
        return 'سبد خرید شما تغییر کرده است. لطفاً صفحه را به‌روزرسانی کنید.';
    }
}