<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class NotificationController extends Controller
{
    /**
     * GET /admin/notifications
     * Returns the authenticated admin's unread notifications, newest first.
     * Capped at 50 to keep polling payloads small.
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->unreadNotifications()
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn ($n) => [
                'id'         => $n->id,
                'type'       => class_basename($n->type),
                'data'       => $n->data,
                'created_at' => $n->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'data'  => $notifications,
            'count' => $notifications->count(),
        ]);
    }

    /**
     * POST /admin/notifications/{id}/read
     * Marks a single notification as read.
     * 404 if not found among THIS user's unread — prevents IDOR.
     */


    public function markRead(Request $request, string $id): JsonResponse
    {
        // PostgreSQL uuid column rejects non-UUID strings with PDOException.
        // Validate format first to return a clean 404.
        if (! Str::isUuid($id)) {
            return response()->json(['message' => 'Notification not found.'], 404);
        }

        $notification = $request->user()
            ->unreadNotifications()
            ->where('id', $id)
            ->first();

        if (! $notification) {
            return response()->json(['message' => 'Notification not found.'], 404);
        }

        $notification->markAsRead();
        return response()->json(['message' => 'Marked as read.']);
    }

    /**
     * POST /admin/notifications/read-all
     * Bulk-marks all unread notifications as read.
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}