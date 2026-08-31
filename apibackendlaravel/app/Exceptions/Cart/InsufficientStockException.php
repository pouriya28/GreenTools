<?php

namespace App\Exceptions\Cart;

use App\Exceptions\ApiException;

class InsufficientStockException extends ApiException
{
    public function __construct(int $productId, int $availableStock)
    {
        parent::__construct("Insufficient stock for product {$productId}.");
        $this->withContext(['product_id' => $productId, 'available_stock' => $availableStock]);
    }

    public function errorCode(): string
    {
        return 'INSUFFICIENT_STOCK';
    }

    public function statusCode(): int
    {
        return 422;
    }

    public function userMessage(): string
    {
        return 'موجودی کافی برای این تعداد وجود ندارد.';
    }
}