<?php
// app/Exceptions/Shipping/ShippingMethodNotSupportedException.php

namespace App\Exceptions\Shipping;

use App\Exceptions\ApiException;

class ShippingMethodNotSupportedException extends ApiException
{
    public function __construct(private readonly int $shippingMethodId)
    {
        parent::__construct("Shipping method {$shippingMethodId} uses an unsupported calculation type (weight_zone, Phase 3).");
    }

    public function errorCode(): string
    {
        return 'SHIPPING_METHOD_NOT_SUPPORTED';
    }

    public function statusCode(): int
    {
        return 422;
    }

    public function userMessage(): string
    {
        return 'این روش ارسال هنوز فعال نشده است.';
    }
}