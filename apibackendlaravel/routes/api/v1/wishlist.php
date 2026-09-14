<?php
// routes/api/v1/wishlist.php

use App\Http\Controllers\Api\V1\Wishlist\WishlistController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'customer.access', 'account.active'])->prefix('wishlist')->group(function () {
    Route::get('/', [WishlistController::class, 'index']);
    Route::get('/product-ids', [WishlistController::class, 'productIds']);
    Route::post('/', [WishlistController::class, 'store']);
    Route::delete('/{product}', [WishlistController::class, 'destroy']);
});