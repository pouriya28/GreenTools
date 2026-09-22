<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\User;
use App\Services\Comment\CommentService;

class CommentPolicy
{
    public function __construct(
        private readonly CommentService $commentService,
    ) {
    }

    // $rawEditToken is only relevant for guest-authored comments; pass it
    // explicitly via Gate::allows('update', [$comment, $rawEditToken]).
    public function update(?User $user, Comment $comment, ?string $rawEditToken = null): bool
    {
        if (! $comment->isEditable()) {
            return false;
        }

        return $this->ownsComment($user, $comment, $rawEditToken);
    }

    public function delete(?User $user, Comment $comment, ?string $rawEditToken = null): bool
    {
        // Staff/support can moderate-delete any comment, regardless of the
        // 1-hour authoring window.
        if ($user?->can('comments.delete')) {
            return true;
        }

        if (! $comment->isEditable()) {
            return false;
        }

        return $this->ownsComment($user, $comment, $rawEditToken);
    }

    public function moderate(User $user): bool
    {
        return $user->can('comments.moderate');
    }

    private function ownsComment(?User $user, Comment $comment, ?string $rawEditToken): bool
    {
        if ($comment->user_id !== null) {
            return $user !== null && $user->id === $comment->user_id;
        }

        // Guest-authored comment: ownership can only be proven with the
        // original edit token — never with the free-text name/email fields.
        return $this->commentService->verifyGuestEditToken($comment, $rawEditToken);
    }
}