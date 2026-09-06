<?php

use App\Http\Controllers\Api\V1\Auth\AdminAuthController;
use App\Http\Controllers\Api\V1\Auth\AdminPasswordController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Auth\OperationPasswordController;
Route::post('login', [AdminAuthController::class, 'login'])
    ->middleware('throttle:admin-login');

Route::post('forgot-password', [AdminPasswordController::class, 'forgot'])
    ->middleware('throttle:password-reset');

Route::post('reset-password', [AdminPasswordController::class, 'reset'])
    ->middleware('throttle:password-reset');

// مرحله دوم ورود (2FA) - فقط با توکن موقتِ has-ability=2fa:pending مجاز است
Route::middleware(['auth:sanctum', 'ability:2fa:pending'])->group(function () {
    Route::post('verify-2fa', [AdminAuthController::class, 'verify2fa']);
});

Route::middleware(['auth:sanctum', 'staff.access', 'account.active'])->group(function () {
    Route::post('setup-2fa', [AdminAuthController::class, 'setup2fa']);
    Route::post('enable-2fa', [AdminAuthController::class, 'enable2fa']);
    Route::post('disable-2fa', [AdminAuthController::class, 'disable2fa']);
    Route::post('logout', [AdminAuthController::class, 'logout']);
    Route::post('logout-all', [AdminAuthController::class, 'logoutAll']);
    Route::post('operation-password/set', [OperationPasswordController::class, 'set'])
        ->middleware('throttle:operation-password');
    Route::post('operation-password/verify', [OperationPasswordController::class, 'verify'])
        ->middleware('throttle:operation-password');
    // نمونه محدودسازی بر اساس نقش/مجوز اسپیتی برای مسیرهای مدیریتی بعدی:
    // Route::middleware('permission:users.manage')->group(function () {
    //     Route::apiResource('users', StaffUserController::class);
    // });
});