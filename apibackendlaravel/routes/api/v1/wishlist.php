<?php

use App\Http\Controllers\Api\V1\Wishlist\WishlistController;
use Illuminate\Support\Facades\Route;

// sanctum.optional: both guests and authenticated users can access wishlist.
// ResolveWishlist: issues/reads the guest_token cookie for unauthenticated requests.
Route::middleware(['sanctum.optional', 'resolve.wishlist'])->prefix('wishlist')->group(function () {
    Route::get('/', [WishlistController::class, 'index']);
    Route::get('/product-ids', [WishlistController::class, 'productIds']);
    Route::post('/', [WishlistController::class, 'store']);
    Route::delete('/{product}', [WishlistController::class, 'destroy']);
});
