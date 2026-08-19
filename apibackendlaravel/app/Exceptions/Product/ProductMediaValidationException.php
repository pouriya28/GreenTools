<?php

namespace App\Exceptions\Product;

use App\Exceptions\ApiException;

/**
 * خطاهای اعتبارسنجی رسانه‌ی محصول (عکس/ویدیو) - تعداد بیش از حد فایل، حجم
 * غیرمجاز یا فرمت نامعتبر. قبلاً این خطاها \RuntimeException خام پرتاب
 * می‌شدن و از مسیر استاندارد ApiException/ApiResponse رد نمی‌شدن؛ یعنی به‌جای
 * پاسخ ۴۲۲ ساختاریافته با پیام فارسی، فرانت یک خطای عمومی ۵۰۰ می‌گرفت.
 */
class ProductMediaValidationException extends ApiException
{
    private function __construct(
        private readonly string $code,
        private readonly string $userFacingMessage,
        string $debugMessage,
    ) {
        parent::__construct($debugMessage);
    }

    public static function tooManyImages(int $max): self
    {
        return new self(
            'PRODUCT_MEDIA_TOO_MANY_IMAGES',
            "حداکثر {$max} عکس در هر بار آپلود مجاز است.",
            'Too many images in a single upload.',
        );
    }

    public static function imageTooLarge(int $maxMb): self
    {
        return new self(
            'PRODUCT_MEDIA_IMAGE_TOO_LARGE',
            "حجم هر عکس نباید بیشتر از {$maxMb} مگابایت باشد.",
            'Uploaded image exceeds the size limit.',
        );
    }

    public static function invalidImage(): self
    {
        return new self(
            'PRODUCT_MEDIA_INVALID_IMAGE',
            'فایل ارسال‌شده یک تصویر معتبر با فرمت مجاز نیست.',
            'Uploaded file failed image content validation.',
        );
    }

    public static function tooManyVideos(int $max): self
    {
        return new self(
            'PRODUCT_MEDIA_TOO_MANY_VIDEOS',
            "حداکثر {$max} ویدیو برای هر محصول مجاز است.",
            'Too many videos for this product.',
        );
    }

    public static function videoFileMissing(): self
    {
        return new self(
            'PRODUCT_MEDIA_VIDEO_FILE_MISSING',
            'فایل ویدیو ارسال نشده است.',
            'Video upload was expected but no file was provided.',
        );
    }

    public static function videoTooLarge(int $maxMb): self
    {
        return new self(
            'PRODUCT_MEDIA_VIDEO_TOO_LARGE',
            "حجم ویدیو نباید بیشتر از {$maxMb} مگابایت باشد.",
            'Uploaded video exceeds the size limit.',
        );
    }

    public static function invalidVideo(): self
    {
        return new self(
            'PRODUCT_MEDIA_INVALID_VIDEO',
            'فرمت ویدیو پشتیبانی نمی‌شود.',
            'Uploaded file failed video mime validation.',
        );
    }

    public function errorCode(): string
    {
        return $this->code;
    }

    public function statusCode(): int
    {
        return 422;
    }

    public function userMessage(): string
    {
        return $this->userFacingMessage;
    }
}
