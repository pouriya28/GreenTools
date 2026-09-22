<?php

use App\Http\Controllers\Api\V1\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\V1\Admin\ProductMediaController;
use App\Http\Controllers\Api\V1\Public\ProductController as PublicProductController;
use Illuminate\Support\Facades\Route;


// ============================================================
// ADMIN
// ============================================================

Route::middleware([
    'auth:sanctum',
    'staff.access',
    'account.active',
])
    ->prefix('admin')
    ->group(function () {

        Route::get('/', [AdminProductController::class, 'index']);
        Route::post('/', [AdminProductController::class, 'store']);

        // Trash
        Route::get('trash', [AdminProductController::class, 'trash']);

        Route::post(
            '{id}/restore',
            [AdminProductController::class, 'restore']
        )->where('id', '[0-9A-HJKMNP-TV-Z]{26}');

        Route::delete(
            '{id}/force',
            [AdminProductController::class, 'forceDestroy']
        )->where('id', '[0-9A-HJKMNP-TV-Z]{26}');


        // Product
        Route::get('{product}', [AdminProductController::class, 'show']);

        Route::patch(
            '{product}',
            [AdminProductController::class, 'update']
        );

        Route::delete(
            '{product}',
            [AdminProductController::class, 'destroy']
        );

        Route::patch(
            '{product}/toggle-featured',
            [AdminProductController::class, 'toggleFeatured']
        );


        // Images
        Route::post(
            '{product}/images',
            [ProductMediaController::class, 'storeImages']
        );

        Route::patch(
            '{product}/images/{image}/primary',
            [ProductMediaController::class, 'setPrimaryImage']
        );

        Route::delete(
            '{product}/images/{image}',
            [ProductMediaController::class, 'destroyImage']
        );


        // Videos
        Route::post(
            '{product}/videos',
            [ProductMediaController::class, 'storeVideo']
        );

        Route::delete(
            '{product}/videos/{video}',
            [ProductMediaController::class, 'destroyVideo']
        );
    });


// ============================================================
// PUBLIC
// ============================================================

// عمومی — فقط خواندن، با throttle در برابر scraping / DoS
Route::middleware('throttle:60,1')->group(function () {

    Route::get(
        'featured',
        [PublicProductController::class, 'featured']
    );

    Route::get(
        '/',
        [PublicProductController::class, 'index']
    );

    Route::get(
        '{slug}',
        [PublicProductController::class, 'show']
    );
});