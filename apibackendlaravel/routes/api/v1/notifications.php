<?php

use App\Http\Controllers\Api\V1\Admin\NotificationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'staff.access', 'account.active'])
    ->prefix('admin/notifications')
    ->name('admin.notifications.')
    ->group(function () {
        Route::get('/',
            [NotificationController::class, 'index'])
            ->middleware('throttle:18,60')   // max 18/hour — generous for 1h polling
            ->name('index');

        Route::post('/read-all',
            [NotificationController::class, 'markAllRead'])
            ->middleware('throttle:3,10')    // max 3 per 10 minutes — low-frequency action
            ->name('readAll');

        Route::post('/{id}/read',
            [NotificationController::class, 'markRead'])
            ->middleware('throttle:3,10')
            ->name('markRead');
    });