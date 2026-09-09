<?php

namespace App\Exceptions\Geocoding;

use Exception;

/**
 * Thrown whenever the reverse-geocoding provider cannot be reached or
 * returns a response we cannot trust. The message on this exception is
 * always safe to show to the end user (no provider internals, no keys,
 * no raw Neshan error codes).
 */
class ReverseGeocodingFailedException extends Exception
{
    public static function providerUnavailable(): self
    {
        return new self('سرویس نقشه در حال حاضر در دسترس نیست. لطفاً آدرس را به‌صورت دستی وارد کنید.');
    }

    public static function timedOut(): self
    {
        return new self('دریافت آدرس بیش از حد طول کشید. دوباره تلاش کنید.');
    }

    public static function addressNotFound(): self
    {
        return new self('آدرسی برای این موقعیت پیدا نشد. لطفاً آدرس را به‌صورت دستی وارد کنید.');
    }

    public static function malformedResponse(): self
    {
        return new self('پاسخ نامعتبری از سرویس نقشه دریافت شد. لطفاً آدرس را به‌صورت دستی وارد کنید.');
    }

    public static function invalidCoordinates(): self
    {
        return new self('موقعیت انتخابی معتبر نیست. لطفاً نقطه‌ای دیگر روی نقشه انتخاب کنید.');
    }

    public static function rateLimited(): self
    {
        return new self('تعداد درخواست زیاد است. چند لحظه دیگر دوباره تلاش کنید.');
    }
}
