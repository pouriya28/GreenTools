<?php

use App\Http\Controllers\Api\V1\Admin\LoyaltyController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'staff.access', 'account.active', 'throttle:60,1'])
    ->prefix('admin/loyalty')
    ->group(function () {
        Route::post('grant', [LoyaltyController::class, 'grant'])
            ->middleware('operation.verified:loyalty.manage');
    });