<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
    'navasan' => [
    'base_url' => env('NAVASAN_BASE_URL', 'https://api.navasan.tech/latest/'),
    'api_key' => env('NAVASAN_API_KEY'),
    // اسم دقیق کلید نرخ دلار رو از داشبورد/مستندات پلن خودت که API_KEY گرفتی تأیید کن؛
    // navasan بسته به پلن، کلیدهای مختلفی مثل usd_sell/usd_buy/usd برمی‌گردونه.
    'usd_rate_key' => env('NAVASAN_USD_RATE_KEY', 'usd_sell'),
    'min_sane_rate' => (int) env('NAVASAN_MIN_SANE_RATE', 200000),   // پایین‌ترین نرخ منطقی (تومان)
    'max_sane_rate' => (int) env('NAVASAN_MAX_SANE_RATE', 2000000),  // بالاترین نرخ منطقی (تومان)
    'max_change_percent' => (float) env('NAVASAN_MAX_CHANGE_PERCENT', 20.0), // حداکثر تغییر مجاز نسبت به آخرین نرخ applied
    
    ],
    'bale' => [
        'bot_token' => env('BALE_BOT_TOKEN'),
        
    ],


];
