<?php

use App\Http\Controllers\Api\V1\Cart\CartController;
use App\Http\Middleware\ResolveCart;
use App\Http\Middleware\ValidateCartOwnership;
use Illuminate\Support\Facades\Route;

Route::middleware(['sanctum.optional', ResolveCart::class])->group(function () {
    Route::get('/', [CartController::class, 'show']);

    Route::middleware(['throttle:cart-write'])->group(function () {
        Route::post('items', [CartController::class, 'addItem']);

        Route::middleware([ValidateCartOwnership::class])->group(function () {
            Route::patch('items/{item}', [CartController::class, 'updateItem']);
            Route::delete('items/{item}', [CartController::class, 'removeItem']);
        });
    });
});