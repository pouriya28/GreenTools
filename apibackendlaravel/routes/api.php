<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Auth\TokenController;

/*
|--------------------------------------------------------------------------
| API Routes - V1
|--------------------------------------------------------------------------
*/

// روت رفرش توکن: احراز هویت از طریق کوکی httpOnly انجام می‌شود (نه Bearer header)
// verify.origin از سوءاستفاده مشابه CSRF روی این اندپوینت جلوگیری می‌کند
Route::middleware(['verify.origin', 'throttle:10,1'])->group(function () {
    Route::post('v1/auth/refresh', [TokenController::class, 'refresh']);
});

// وارد کردن فایل‌های جداگانه روت
Route::prefix('v1/auth/customer')->group(base_path('routes/api/v1/customer_auth.php'));
Route::prefix('v1/auth/staff')->group(base_path('routes/api/v1/staff_auth.php'));
Route::prefix('v1/categories')->group(base_path('routes/api/v1/categories.php'));
Route::prefix('v1/products')->group(base_path('routes/api/v1/products.php'));