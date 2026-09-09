<?php

use App\Http\Controllers\Api\V1\Address\MapController;
use Illuminate\Support\Facades\Route;

// Reverse geocoding never mutates data, so it stays under normal auth (no
// staff/admin gate needed) but is throttled separately from other endpoints
// because it proxies a paid external API.
Route::middleware(['auth:sanctum', 'throttle:reverse-geocode'])->group(function () {
    Route::post('/map/reverse-geocode', [MapController::class, 'reverseGeocode']);
});
Route::middleware(['auth:sanctum', 'throttle:search-address'])->group(function () {
    Route::post('/map/search', [MapController::class, 'search']);
});