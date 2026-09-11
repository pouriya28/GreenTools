<?php

use App\Http\Controllers\Api\V1\Admin\StoreStatusController;
use Illuminate\Support\Facades\Route;

// permission:store.manage-status باید به‌عنوان یک Permission جدید در
// RolePermissionSeeder ایجاد و فقط به نقش admin اختصاص داده شود.
Route::middleware(['auth:sanctum', 'staff.access', 'account.active', 'permission:store.manage-status'])
    ->prefix('admin/store-status')
    ->group(function () {
        Route::get('/', [StoreStatusController::class, 'show']);
        Route::post('/close', [StoreStatusController::class, 'close']);
        Route::post('/open', [StoreStatusController::class, 'open']);
    });