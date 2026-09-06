<?php

use App\Http\Controllers\Api\V1\Auth\CustomerOtpController;
use App\Http\Controllers\Api\V1\Customer\CustomerLoyaltyController;
use Illuminate\Support\Facades\Route;

Route::post('send-otp', [CustomerOtpController::class, 'send'])
    ->middleware('throttle:otp-send');

Route::post('verify-otp', [CustomerOtpController::class, 'verify'])
    ->middleware('throttle:otp-verify');

Route::middleware(['auth:sanctum', 'ability:customer:api', 'customer.access', 'account.active'])->group(function () {
    Route::post('logout', [CustomerOtpController::class, 'logout']);
    Route::post('logout-all', [CustomerOtpController::class, 'logoutAll']);
    Route::get('loyalty/me', [CustomerLoyaltyController::class, 'me']); // NEW

    // بقیه‌ی اندپوینت‌های محافظت‌شده‌ی مشتری در این‌جا اضافه شوند
    // مثال: Route::get('me', [CustomerProfileController::class, 'show']);
});