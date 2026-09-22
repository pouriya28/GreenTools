<?php
// app/Http/Resources/CommentResource.php

namespace App\Http\Resources;

use App\Services\Comment\CommentAuthorPresenter;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'body' => $this->body,
            'rating' => $this->rating,
            'status' => $this->status->value,

            'author' => [
                'role' => $this->authorRole()->value, // 'guest' | 'member' | 'support'
                'label' => app(CommentAuthorPresenter::class)->label($this->resource),
            ],

            // Time-window + status check only (created_at + still pending).
            // Real ownership (member match / guest edit-token match) is
            // enforced separately by CommentPolicy before the frontend is
            // even allowed to call the update endpoint — this flag is only
            // a UI hint, never a security boundary by itself.
            'is_editable' => $this->isEditable(),

            'created_at' => $this->created_at->toIso8601String(),

            'replies' => self::collection($this->whenLoaded('replies')),

            // user_id, guest_name, guest_email, edit_token_hash, ip_address,
            // and user_agent are intentionally never included here.
        ];
    }
}