<?php

namespace App\Exceptions\Checkout;

use App\Exceptions\ApiException;

class EmptyCartException extends ApiException
{
    public function __construct()
    {
        parent::__construct('Cannot checkout an empty cart.');
    }

    public function errorCode(): string
    {
        return 'CHECKOUT_VALIDATION_FAILED';
    }

    public function statusCode(): int
    {
        return 422;
    }

    public function userMessage(): string
    {
        return 'سبد خرید شما خالی است.';
    }
}