<?php

use App\Http\Controllers\Api\V1\Location\LocationController;
use Illuminate\Support\Facades\Route;

// Public reference data (no auth) -- province/city names are not sensitive,
// and the address/checkout forms need this before/without a session in some
// flows. Still throttled to prevent scraping/abuse.
Route::middleware(['throttle:60,1'])->prefix('locations')->group(function () {
    Route::get('/provinces', [LocationController::class, 'provinces']);
});
