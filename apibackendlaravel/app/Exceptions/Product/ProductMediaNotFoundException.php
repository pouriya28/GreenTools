<?php

namespace App\Exceptions\Product;

use App\Exceptions\ApiException;

/**
 * وقتی عکس/ویدیوی ارسالی متعلق به محصول مسیر (route) نیست. عمداً ۴۰۴
 * برمی‌گردونیم (نه ۴۲۲/۴۰۳) تا با رفتار ProductMediaController::destroyImage/
 * destroyVideo که برای همین حالت abort(404) می‌زنه یکسان باشه.
 */
class ProductMediaNotFoundException extends ApiException
{
    private function __construct(
        private readonly string $code,
        private readonly string $userFacingMessage,
        string $debugMessage,
    ) {
        parent::__construct($debugMessage);
    }

    public static function imageNotOwnedByProduct(): self
    {
        return new self(
            'PRODUCT_IMAGE_NOT_FOUND',
            'این عکس متعلق به این محصول نیست.',
            'Image does not belong to the given product.',
        );
    }

    public static function videoNotOwnedByProduct(): self
    {
        return new self(
            'PRODUCT_VIDEO_NOT_FOUND',
            'این ویدیو متعلق به این محصول نیست.',
            'Video does not belong to the given product.',
        );
    }

    public function errorCode(): string
    {
        return $this->code;
    }

    public function statusCode(): int
    {
        return 404;
    }

    public function userMessage(): string
    {
        return $this->userFacingMessage;
    }
}
