<?php

namespace App\Services\Comment;

use App\Exceptions\Comment\CommentRateLimitExceededException;
use App\Exceptions\Comment\CommentReplyDepthExceededException;
use App\Exceptions\Comment\DuplicateCommentRatingException;
use App\Models\Comment;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class CommentService
{
    /**
     * @param array<string, mixed> $validated Already-validated StoreCommentRequest data.
     * @return array{comment: Comment, rawEditToken: ?string}
     */
    public function create(array $validated, ?User $user, Request $request): array
    {
        $this->enforceRateLimit($user, $request);
        $this->assertReplyDepthAllowed(
            $validated['parent_id'] ?? null,
            $validated['commentable_type'],
            (int) $validated['commentable_id'],
        );

        $rawEditToken = null;
        $editTokenHash = null;

        if ($user === null) {
            [$rawEditToken, $editTokenHash] = $this->generateGuestEditToken();
        }

        $comment = new Comment([
            'commentable_type' => $validated['commentable_type'],
            'commentable_id' => $validated['commentable_id'],
            'parent_id' => $validated['parent_id'] ?? null,
            'user_id' => $user?->id,
            'guest_name' => $user === null ? $validated['guest_name'] : null,
            'guest_email' => $user === null ? $validated['guest_email'] : null,
            'body' => $validated['body'],
            'rating' => $validated['rating'] ?? null,
            'ip_address' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
            
        ]);

        // edit_token_hash is intentionally excluded from $fillable, so it
        // must be set explicitly rather than via mass assignment.
        $comment->status = \App\Enums\CommentStatus::Pending;
        $comment->edit_token_hash = $editTokenHash;

        try {
            $comment->save();
        } catch (QueryException $exception) {
            if ($this->isDuplicateRatingViolation($exception)) {
                throw new DuplicateCommentRatingException();
            }

            throw $exception;
        }

        return ['comment' => $comment, 'rawEditToken' => $rawEditToken];
    }

    // Used by CommentPolicy to verify a guest's ownership claim without
    // ever comparing plaintext tokens.
    public function verifyGuestEditToken(Comment $comment, ?string $rawToken): bool
    {
        if ($comment->edit_token_hash === null || $rawToken === null) {
            return false;
        }

        return hash_equals($comment->edit_token_hash, hash('sha256', $rawToken));
    }

    private function enforceRateLimit(?User $user, Request $request): void
    {
        $key = 'comment-write:' . ($user?->id ?? $request->ip());

        // 10 comments per 10 minutes per member/guest IP.
        $executed = RateLimiter::attempt($key, 10, static fn () => true, 600);

        if (! $executed) {
            throw new CommentRateLimitExceededException();
        }
    }

    private function assertReplyDepthAllowed(?int $parentId, string $commentableType, int $commentableId): void
    {
        if ($parentId === null) {
            return;
        }

        $parent = Comment::query()->find($parentId);

        // StoreCommentRequest already validates this; this is a
        // defense-in-depth recheck for any other future caller of this service.
        if ($parent === null
            || $parent->parent_id !== null
            || $parent->commentable_type !== $commentableType
            || $parent->commentable_id !== $commentableId
        ) {
            throw new CommentReplyDepthExceededException();
        }
    }

    /**
     * @return array{0: string, 1: string} [rawToken, sha256Hash]
     */
    private function generateGuestEditToken(): array
    {
        $raw = Str::random(64);

        return [$raw, hash('sha256', $raw)];
    }

    private function isDuplicateRatingViolation(QueryException $exception): bool
    {
        return str_contains($exception->getMessage(), 'comments_unique_member_rating')
            || str_contains($exception->getMessage(), 'comments_unique_guest_rating');
    }
}