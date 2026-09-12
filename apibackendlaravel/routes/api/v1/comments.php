<?php

use App\Http\Controllers\Api\V1\Admin\CommentModerationController;
use App\Http\Controllers\Api\V1\Comment\CommentController;
use Illuminate\Support\Facades\Route;

// Public (member or guest) endpoints.
Route::middleware(['sanctum.optional','throttle:comment-write'])->group(function () {
    Route::get('/comments', [CommentController::class, 'index']);
    Route::post('/comments', [CommentController::class, 'store']);
    Route::patch('/comments/{comment}', [CommentController::class, 'update']);
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);
});

// Admin/staff moderation queue.
Route::prefix('admin/comments')
    ->middleware(['auth:sanctum', 'staff.access', 'account.active', 'throttle:120,1'])
    ->group(function () {
        Route::get('/', [CommentModerationController::class, 'index']);
        Route::patch('/{comment}/approve', [CommentModerationController::class, 'approve']);
        Route::patch('/{comment}/reject', [CommentModerationController::class, 'reject']);
        Route::delete('/{comment}', [CommentModerationController::class, 'destroy']);
    });