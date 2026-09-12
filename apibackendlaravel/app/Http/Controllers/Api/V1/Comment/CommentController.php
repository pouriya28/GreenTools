<?php

namespace App\Http\Controllers\Api\V1\Comment;

use App\Enums\CommentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Comment\StoreCommentRequest;
use App\Http\Requests\Api\V1\Comment\UpdateCommentRequest;
use App\Http\Resources\CommentResource;
use App\Http\Responses\ApiResponse;
use App\Models\Comment;
use App\Services\Comment\CommentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CommentController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'commentable_type' => ['required', 'string'],
            'commentable_id' => ['required', 'integer'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);

        $paginator = Comment::query()
            ->where('commentable_type', $validated['commentable_type'])
            ->where('commentable_id', $validated['commentable_id'])
            ->where('status', CommentStatus::Approved)
            ->whereNull('parent_id')
            ->with('replies')
            ->latest()
            ->paginate(
                $validated['per_page'] ?? 5,
                page: $validated['page'] ?? 1,
            );

        // ApiResponse::success wraps the value directly (not through Laravel's
        // automatic pagination toResponse()), so metadata must be rebuilt
        // manually — same fix already applied to CommentModerationController.
        return ApiResponse::success([
            'items' => CommentResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(StoreCommentRequest $request, CommentService $commentService)
    {
        ['comment' => $comment, 'rawEditToken' => $rawEditToken] = $commentService->create(
            $request->validated(),
            $request->user(),
            $request,
        );

        $response = ApiResponse::success(new CommentResource($comment), status: 201);

        if ($rawEditToken !== null) {
            $response = $response->cookie(
                name: "comment_edit_token_{$comment->id}",
                value: $rawEditToken,
                minutes: 60,
                httpOnly: true,
            );
        }

        return $response;
    }

    public function update(UpdateCommentRequest $request, Comment $comment)
    {
        $comment->update($request->validated());

        return ApiResponse::success(new CommentResource($comment));
    }

    public function destroy(Request $request, Comment $comment)
    {
        Gate::authorize('delete', [$comment, $request->cookie("comment_edit_token_{$comment->id}")]);

        $comment->delete();

        return ApiResponse::success(null, status: 204);
    }
}