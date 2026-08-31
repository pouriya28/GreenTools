<?php

namespace App\Exceptions\Cart;

use App\Enums\PurchaseRequirement;
use App\Exceptions\ApiException;

class PurchaseConfirmationRequiredException extends ApiException
{
    public function __construct(int $productId, ?PurchaseRequirement $requirement)
    {
        parent::__construct('Purchase confirmation required.');
        $this->withContext([
            'product_id' => $productId,
            'purchase_requirement' => $requirement?->value,
        ]);
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
        return 'برای این محصول نیاز به تایید شرایط خرید دارید.';
    }
}