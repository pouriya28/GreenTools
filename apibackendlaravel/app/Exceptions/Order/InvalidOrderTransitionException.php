<?php
// app/Exceptions/Order/InvalidOrderTransitionException.php

namespace App\Exceptions\Order;

use App\Enums\OrderStatus;
use App\Exceptions\ApiException;

class InvalidOrderTransitionException extends ApiException
{
    public function __construct(public readonly OrderStatus $from, public readonly OrderStatus $to)
    {
        parent::__construct("Invalid order transition from {$from->value} to {$to->value}.");

        $this->withContext(['from' => $from->value, 'to' => $to->value]);
    }

    public function errorCode(): string
    {
        return 'INVALID_ORDER_TRANSITION';
    }

    public function statusCode(): int
    {
        return 409;
    }

    public function userMessage(): string
    {
        return 'وضعیت فعلی سفارش اجازه‌ی این تغییر را نمی‌دهد.';
    }
}