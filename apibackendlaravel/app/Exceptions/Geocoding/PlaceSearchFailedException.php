<?php

namespace App\Exceptions\Geocoding;

use Exception;

final class PlaceSearchFailedException extends Exception
{
    public static function invalidQuery(): self
    {
        return new self('پارامترهای جستجو نامعتبر است.');
    }

    public static function providerUnavailable(): self
    {
        return new self('سرویس جستجوی آدرس در حال حاضر در دسترس نیست. لطفاً بعداً تلاش کنید.');
    }

    public static function rateLimited(): self
    {
        return new self('تعداد درخواست‌های جستجو بیش از حد مجاز است. کمی صبر کنید و دوباره تلاش کنید.');
    }

    public static function timedOut(): self
    {
        return new self('پاسخی از سرویس جستجوی آدرس دریافت نشد. لطفاً دوباره تلاش کنید.');
    }

    public static function malformedResponse(): self
    {
        return new self('پاسخ سرویس جستجوی آدرس نامعتبر بود.');
    }


    
}