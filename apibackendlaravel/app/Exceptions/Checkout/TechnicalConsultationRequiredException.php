<?php

namespace App\Exceptions\Checkout;

use App\Exceptions\ApiException;

class TechnicalConsultationRequiredException extends ApiException
{
    public function __construct(int $productId)
    {
        parent::__construct('Technical consultation approval required.');
        $this->withContext(['product_id' => $productId]);
    }

    public function errorCode(): string
    {
        return 'TECHNICAL_CONFIRMATION_REQUIRED';
    }

    public function statusCode(): int
    {
        return 422;
    }

    public function userMessage(): string
    {
        return 'برای خرید این محصول نیاز به تایید مشاوره فنی دارید.';
    }
}