<?php
// routes/api/v1/shipping.php

use App\Http\Controllers\Api\V1\Admin\ShippingMethodController as AdminShippingMethodController;
use App\Http\Controllers\Api\V1\Public\ShippingMethodController;
use App\Http\Controllers\Api\V1\Shipping\ShippingQuoteController;
use App\Http\Controllers\Api\V1\Admin\SenderAddressController;
use App\Http\Controllers\Api\V1\Admin\ShippingLabelController;
use Illuminate\Support\Facades\Route;

// Public: browse available shipping methods (metadata only, price comes from the quote endpoint).
Route::get('shipping-methods', [ShippingMethodController::class, 'index']);

// Customer-scoped: real price for the current cart + a chosen method.
Route::middleware(['auth:sanctum', 'resolve-cart'])
    ->post('shipping-quote', [ShippingQuoteController::class, 'store']);

// Admin CRUD.
Route::prefix('admin/shipping-methods')
    ->middleware(['auth:sanctum', 'staff.access', 'account.active', 'throttle:120,1'])
    ->group(function () {
        Route::get('/', [AdminShippingMethodController::class, 'index']);
        Route::post('/', [AdminShippingMethodController::class, 'store']);
        Route::get('/{shippingMethod}', [AdminShippingMethodController::class, 'show']);
        Route::patch('/{shippingMethod}', [AdminShippingMethodController::class, 'update']);
        Route::delete('/{shippingMethod}', [AdminShippingMethodController::class, 'destroy']);
    });

// Admin: shipping label printing.
Route::prefix('admin/shipping-labels')
    ->middleware(['auth:sanctum', 'staff.access', 'account.active', 'throttle:10,1'])
    ->group(function () {
        Route::post('/', [ShippingLabelController::class, 'generate']);
    });

// Admin CRUD: sender addresses (used when generating shipping labels).
Route::prefix('admin/sender-addresses')
    ->middleware(['auth:sanctum', 'staff.access', 'account.active', 'throttle:120,1'])
    ->group(function () {
        Route::get('/', [SenderAddressController::class, 'index']);
        Route::post('/', [SenderAddressController::class, 'store']);
        Route::get('/{senderAddress}', [SenderAddressController::class, 'show']);
        Route::patch('/{senderAddress}', [SenderAddressController::class, 'update']);
        Route::delete('/{senderAddress}', [SenderAddressController::class, 'destroy']);
    });    