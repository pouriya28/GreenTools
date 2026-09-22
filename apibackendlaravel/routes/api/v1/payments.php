<?php

use App\Http\Controllers\Api\V1\Payments\PaymentWebhookController;
use Illuminate\Support\Facades\Route;

// No auth guard — the gateway calls this directly. Security is enforced
// inside the controller via signature verification (fail-closed).
Route::post('webhook/{gateway}', [PaymentWebhookController::class, 'handle']);

