<?php

use App\Http\Controllers\Api\V1\Admin\PriceProposalController;
use Illuminate\Support\Facades\Route;

// این فایل فقط بازبینی/تایید پیشنهادهای قیمت محصولات (سمت «به‌روزرسانی
// قیمت محصولات») را دارد. مدیریت نرخ ارز (ورود دستی/دریافت از API/تایید/
// زمان‌بندی) طبق تصمیم تایید‌شده به routes/api/v1/exchange-rates.php منتقل شد و از
// permission مجزای exchange-rates.manage استفاده می‌کند.
Route::middleware([
    'auth:sanctum',
    'staff.access',
    'account.active',
    'throttle:120,1',
])
    ->prefix('admin/prices')
    ->group(function () {

        // Proposals review (batch = یک اجرای چک نرخ دلار یا یک override دستی)
        Route::get('proposals', [PriceProposalController::class, 'index']);
        Route::get('proposals/{batchId}/export', [PriceProposalController::class, 'exportCsv']);

        Route::patch('proposals/{proposal}', [PriceProposalController::class, 'update']);
        Route::post('proposals/{proposal}/approve', [PriceProposalController::class, 'approve']);
        Route::post('proposals/{proposal}/reject', [PriceProposalController::class, 'reject']);

        Route::post('proposals/batch/{batchId}/approve', [PriceProposalController::class, 'approveBatch']);
        Route::post('proposals/batch/{batchId}/reject', [PriceProposalController::class, 'rejectBatch']);
    });
