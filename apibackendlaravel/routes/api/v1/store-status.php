<?php

use App\Http\Controllers\Api\V1\StoreStatusController;
use Illuminate\Support\Facades\Route;

// 'staff' همان اسمیست که در StaffAccessMiddleware ثبت کرده‌اید. permission:store.manage-status
// باید به‌عنوان یک Permission جدید در RolePermissionSeeder ایجاد و فقط به نقش admin اختصاص داده شود.
Route::middleware(['auth:sanctum', 'staff', 'permission:store.manage-status'])
    ->prefix('admin/store-status')
    ->group(function () {
        Route::get('/', [StoreStatusController::class, 'show']);
        Route::post('/close', [StoreStatusController::class, 'close']);
        Route::post('/open', [StoreStatusController::class, 'open']);
    });
