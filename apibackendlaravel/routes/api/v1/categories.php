<?php

use App\Http\Controllers\Api\V1\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\V1\Public\CategoryController as PublicCategoryController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'staff.access', 'account.active', 'throttle:60,1'])
    ->prefix('admin')->group(function () {
        Route::get('/', [AdminCategoryController::class, 'index']);
        Route::post('/', [AdminCategoryController::class, 'store']);

        Route::get('trash', [AdminCategoryController::class, 'trash']);
        Route::post('{id}/restore', [AdminCategoryController::class, 'restore'])->whereUlid('id');
        Route::delete('{id}/force', [AdminCategoryController::class, 'forceDestroy'])->whereUlid('id');
        Route::patch('{category}', [AdminCategoryController::class, 'update']);
        Route::delete('{category}', [AdminCategoryController::class, 'destroy']);
    });

Route::middleware(['throttle:120,1'])->group(function () {
    Route::get('/', [PublicCategoryController::class, 'index']);
    Route::get('{slug}', [PublicCategoryController::class, 'show']);
});