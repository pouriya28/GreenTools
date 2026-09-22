<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentAdminResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'commentable_type' => $this->commentable_type,
            'commentable_id' => $this->commentable_id,
            'parent_id' => $this->parent_id,
            'parent' => $this->when($this->parent_id !== null, fn () => [
                'id' => $this->parent?->id,
                'body' => $this->parent?->body,
            ]),            
            'body' => $this->body,
            'rating' => $this->rating,
            'status' => $this->status->value,
            'member' => $this->when($this->user_id !== null, fn () => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
                'email' => $this->user?->email,
            ]),
            'guest_name' => $this->guest_name,
            'guest_email' => $this->guest_email,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'reviewed_by' => $this->reviewed_by,
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}