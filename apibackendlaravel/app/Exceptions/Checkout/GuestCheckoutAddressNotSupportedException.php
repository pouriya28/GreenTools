<?php

namespace App\Exceptions\Checkout;

use App\Exceptions\ApiException;
use App\Support\HttpStatusCodes;

/**
 * Address/OrderAddressSnapshot در حال حاضر به یک user_id واقعی وابسته‌اند.
 * سبدهای مهمان (guest, user_id === null) نمی‌توانند آدرس ذخیره‌شده داشته باشند.
 * این یک نکته‌ی طراحی باز است: اگر checkout مهمان باید پشتیبانی شود، باید یک فلوی
 * جدا (آدرس inline بدون ذخیره در جدول addresses) طراحی شود.
 */
class GuestCheckoutAddressNotSupportedException extends ApiException
{
    public function __construct()
    {
        parent::__construct('Guest checkout does not support saved addresses yet.');
    }

    public function errorCode(): string
    {
        return HttpStatusCodes::codeFor(422);
    }

    public function statusCode(): int
    {
        return 422;
    }

    public function userMessage(): string
    {
        return 'برای ثبت آدرس و تکمیل سفارش، ابتدا وارد حساب کاربری خود شوید.';
    }
}
