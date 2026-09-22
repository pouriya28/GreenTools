<?php

namespace App\Exceptions\Cart;

use App\Exceptions\ApiException;

class ProductUnavailableException extends ApiException
{
    public function __construct(string $productId)
    {
        parent::__construct("Product {$productId} is unavailable.");
        $this->withContext(['product_id' => $productId]);
    }

    public function errorCode(): string
    {
        return 'PRODUCT_UNAVAILABLE';
    }

    public function statusCode(): int
    {
        return 422;
    }

    public function userMessage(): string
    {
        return 'این محصول در حال حاضر موجود نیست.';
    }
}