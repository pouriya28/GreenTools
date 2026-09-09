<?php
// app/Exceptions/Shipping/ShippingMethodUnavailableException.php

namespace App\Exceptions\Shipping;

use App\Exceptions\ApiException;

class ShippingMethodUnavailableException extends ApiException
{
    public function __construct(private readonly int $shippingMethodId)
    {
        parent::__construct("Shipping method {$shippingMethodId} is not available for this cart.");
    }

    public function errorCode(): string
    {
        return 'SHIPPING_METHOD_UNAVAILABLE';
    }

    public function statusCode(): int
    {
        return 422;
    }

    public function userMessage(): string
    {
        return 'روش ارسال انتخاب‌شده برای سبد خرید فعلی در دسترس نیست.';
    }
}