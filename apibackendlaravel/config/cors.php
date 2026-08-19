<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // هرگز '*' نذار، چون با supports_credentials=true ناسازگاره و مرورگر ردش می‌کنه.
    // باید دقیقاً همون آدرسی باشه که فرانت روش اجرا می‌شه (با پورت، بدون اسلش آخر).
    'allowed_origins' => explode(',', env('FRONTEND_URLS', 'http://localhost:5173')),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // این باید true باشه تا کوکی httpOnly رفرش‌توکن اصلاً در ریسپانس ست بشه
    'supports_credentials' => true,

    // این کلید توسط VerifyOriginForCookie.php خونده می‌شه (کلید سفارشیه، جزو کانفیگ پیش‌فرض لاراول نیست)
    'frontend_origins' => env('FRONTEND_URLS', 'http://localhost:5173'),

];