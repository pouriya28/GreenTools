<?php
// routes/api/v1/orders.php

use App\Http\Controllers\Api\V1\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\V1\Customer\CustomerOrderController;
use Illuminate\Support\Facades\Route;

// Customer-facing: view own orders and their status only.
Route::middleware(['auth:sanctum', 'customer.access', 'account.active'])
    ->prefix('orders')
    ->group(function () {
        Route::get('/', [CustomerOrderController::class, 'index']);
        Route::get('/{order}', [CustomerOrderController::class, 'show']);
    });

// Admin/staff panel: view all orders, transition status.
Route::middleware(['auth:sanctum', 'staff.access', 'account.active', 'throttle:120,1'])
    ->prefix('admin/orders')
    ->group(function () {
        Route::get('/', [AdminOrderController::class, 'index']);
        Route::get('/{order}', [AdminOrderController::class, 'show']);
        Route::patch('/{order}/status', [AdminOrderController::class, 'updateStatus']);
    });