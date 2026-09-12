<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\CommentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\CommentAdminResource;
use App\Http\Responses\ApiResponse;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CommentModerationController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('moderate', Comment::class);

        $paginator = Comment::query()
            ->where('status', CommentStatus::Pending)
            ->with(['user', 'parent'])
            ->latest()
            ->paginate(20);

        // ApiResponse::success مستقیم wrap می‌کنه (نه از مسیر toResponse()
        // خودکار Laravel)، پس متادیتای صفحه‌بندی رو دستی می‌سازیم تا از
        // بین نره — همون باگی که در endpoint عمومی کامنت‌ها هم داشتیم.
        return ApiResponse::success([
            'items' => CommentAdminResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function approve(Request $request, Comment $comment)
    {
        Gate::authorize('moderate', Comment::class);

        $comment->status = CommentStatus::Approved;
        $comment->reviewed_by = $request->user()->id;
        $comment->reviewed_at = now();
        $comment->save();

        return ApiResponse::success(new CommentAdminResource($comment));
    }

    public function reject(Request $request, Comment $comment)
    {
        Gate::authorize('moderate', Comment::class);

        $comment->status = CommentStatus::Rejected;
        $comment->reviewed_by = $request->user()->id;
        $comment->reviewed_at = now();
        $comment->save();

        return ApiResponse::success(new CommentAdminResource($comment));
    }

    public function destroy(Comment $comment)
    {
        // Staff bypass path inside CommentPolicy::delete() (comments.delete permission).
        Gate::authorize('delete', [$comment]);

        $comment->delete();

        return ApiResponse::success(null, status: 204);
    }
}