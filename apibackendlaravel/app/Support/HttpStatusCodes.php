<?php

namespace App\Support;

final class HttpStatusCodes
{
    private const MAP = [
        400 => 'BAD_REQUEST',
        401 => 'UNAUTHENTICATED',
        403 => 'FORBIDDEN',
        404 => 'NOT_FOUND',
        405 => 'METHOD_NOT_ALLOWED',
        406 => 'NOT_ACCEPTABLE',
        409 => 'CONFLICT',
        413 => 'PAYLOAD_TOO_LARGE',
        415 => 'UNSUPPORTED_MEDIA_TYPE',
        422 => 'VALIDATION_ERROR',
        429 => 'RATE_LIMITED',
        503 => 'MAINTENANCE',
    ];

    public static function codeFor(int $status): string
    {
        return self::MAP[$status] ?? ($status >= 500 ? 'SERVER_ERROR' : 'ERROR');
    }

    public static function safeMessageFor(int $status): string
    {
        return match (true) {
            $status === 400 => 'درخواست نامعتبر است.',
            $status === 401 => 'برای این عملیات باید وارد شوید.',
            $status === 403 => 'شما دسترسی لازم برای این عملیات را ندارید.',
            $status === 404 => 'موردی یافت نشد.',
            $status === 405 => 'این متد برای این مسیر مجاز نیست.',
            $status === 409 => 'این عملیات با وضعیت فعلی داده تداخل دارد.',
            $status === 413 => 'حجم فایل ارسالی بیش از حد مجاز است.',
            $status === 415 => 'فرمت فایل ارسالی پشتیبانی نمی‌شود.',
            $status === 429 => 'تعداد درخواست‌ها بیش از حد مجاز است. کمی صبر کنید.',
            $status === 503 => 'سرویس موقتاً در دسترس نیست.',
            $status >= 500 => 'خطایی در سرور رخ داده است. لطفاً بعداً تلاش کنید.',
            default => 'خطایی رخ داده است.',
        };
    }
}