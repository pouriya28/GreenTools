<?php
// app/Services/Comment/CommentAuthorPresenter.php

namespace App\Services\Comment;

use App\Enums\CommentAuthorRole;
use App\Models\Comment;
use App\Services\Loyalty\LevelResolver; // TODO: confirm exact return shape once file arrives

class CommentAuthorPresenter
{
    public function __construct(
        private readonly LevelResolver $levelResolver,
    ) {
    }

    // Returns a display-safe label only — never phone, email, or real name.
    public function label(Comment $comment): string
    {
        return match ($comment->authorRole()) {
            CommentAuthorRole::Guest => 'مهمان',
            CommentAuthorRole::Support => 'پشتیبان',
            CommentAuthorRole::Member => $this->memberLabel($comment),
        };
    }

    private function memberLabel(Comment $comment): string
    {
        $loyaltyPoints = $comment->user?->loyalty_points ?? 0;

        // Placeholder call — label property name will be adjusted once
        // the real LevelResolver/Level enum is confirmed.
        $level = $this->levelResolver->resolve($loyaltyPoints);

        return 'کاربر ' . $level->label;
    }
}