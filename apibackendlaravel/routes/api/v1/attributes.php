<?php

use App\Http\Controllers\Api\V1\Admin\AttributeController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'staff.access', 'account.active'])
    ->get('admin/attributes', [AttributeController::class, 'index']);
