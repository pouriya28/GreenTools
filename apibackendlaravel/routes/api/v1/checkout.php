<?php

use App\Http\Controllers\Api\V1\Checkout\CheckoutController;
use App\Http\Middleware\ResolveCart;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', ResolveCart::class, 'throttle:checkout'])->group(function () {
    Route::post('/', [CheckoutController::class, 'store']);
});