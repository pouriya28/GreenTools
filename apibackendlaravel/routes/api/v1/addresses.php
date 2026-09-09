<?php

use App\Http\Controllers\Api\V1\Address\AddressController;
use Illuminate\Support\Facades\Route;

// نام میدل‌ور 'customer' را با همان چیزی که در CustomerAccessMiddleware ثبت کرده‌اید هماهنگ کنید.
Route::middleware(['auth:sanctum', 'customer.access'])->prefix('addresses')->group(function () {
    Route::get('/', [AddressController::class, 'index']);
    Route::post('/', [AddressController::class, 'store']);
    Route::get('/{address}', [AddressController::class, 'show']);
    Route::put('/{address}', [AddressController::class, 'update']);
    Route::delete('/{address}', [AddressController::class, 'destroy']);
    Route::post('/{address}/default', [AddressController::class, 'setDefault']);
    
});
