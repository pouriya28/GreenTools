<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Auth\TokenController;

/*
|--------------------------------------------------------------------------
| API Routes - V1
|--------------------------------------------------------------------------
*/

// Token refresh route: authenticated via httpOnly cookie (not a Bearer header).
// verify.origin protects this endpoint against CSRF-style abuse.
Route::middleware(['verify.origin', 'throttle:token-refresh'])->group(function () {
    Route::post('v1/auth/refresh', [TokenController::class, 'refresh']);
});

// Include per-resource route files.
Route::prefix('v1/auth/customer')->group(base_path('routes/api/v1/customer_auth.php'));
Route::prefix('v1/auth/staff')->group(base_path('routes/api/v1/staff_auth.php'));
Route::prefix('v1/categories')->group(base_path('routes/api/v1/categories.php'));
Route::prefix('v1/products')->group(base_path('routes/api/v1/products.php'));

// سبد خرید (guest + authenticated). امنیت/مالکیت داخل ResolveCart و
// ValidateCartOwnership اعمال می‌شود، نه در این فایل.
Route::prefix('v1/cart')->group(base_path('routes/api/v1/cart.php'));

// شروع فرآیند پرداخت/سفارش. فقط برای کاربر احراز هویت‌شده (auth:sanctum).
Route::prefix('v1/checkout')->group(base_path('routes/api/v1/checkout.php'));

// callback درگاه پرداخت. بدون auth guard؛ امنیت با تایید امضا در کنترلر
// به‌صورت fail-closed تضمین می‌شود.
Route::prefix('v1/payments')->group(base_path('routes/api/v1/payments.php'));

// بررسی و تایید پیشنهادهای قیمت محصولات (سمت «به‌روزرسانی قیمت محصولات»).
// مسیرهای خودرا به‌صورت کامل (admin/prices/*) داخل pricing.php دارند.
Route::prefix('v1')->group(base_path('routes/api/v1/pricing.php'));

// مدیریت نرخ ارز (سمت «قیمت ارز») - کاملاً مجزا از pricing.php طبق تصمیم
// تایید‌شده. مسیرهای خودرا به‌صورت کامل (admin/exchange-rates/*) داخل
// exchange-rates.php دارند - مطابق با BASE جدید frontend که باید pricingApi.ts را به
// این مسیر اشاره دهد.
Route::prefix('v1')->group(base_path('routes/api/v1/exchange-rates.php'));
Route::prefix('v1')->group(base_path('routes/api/v1/loyalty.php'));
Route::prefix('v1')->group(base_path('routes/api/v1/addresses.php'));
Route::prefix('v1')->group(base_path('routes/api/v1/map.php'));
Route::prefix('v1')->group(base_path('routes/api/v1/location.php'));
Route::prefix('v1')->group(base_path('routes/api/v1/shipping.php'));
Route::prefix('v1')->group(base_path('routes/api/v1/store-status.php'));
Route::prefix('v1')->group(base_path('routes/api/v1/comments.php'));
Route::prefix('v1')->group(base_path('routes/api/v1/orders.php'));
Route::prefix('v1')->group(base_path('routes/api/v1/wishlist.php'));