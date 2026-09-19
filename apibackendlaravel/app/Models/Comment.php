<?php

namespace App\Models;

use App\Enums\CommentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Enums\CommentAuthorRole;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
class Comment extends Model
{
    use HasUlids, HasFactory, SoftDeletes;

    protected $fillable = [
        'commentable_type', 'commentable_id', 'parent_id',
        'user_id', 'guest_name', 'guest_email',
        'body', 'rating', 'ip_address', 'user_agent',
    ];

    // edit_token_hash, status, reviewed_by, reviewed_at are intentionally
    // excluded from $fillable — written only by CommentService /
    // ModerationService, never from raw request input.
    protected $hidden = ['edit_token_hash', 'ip_address', 'user_agent'];

    protected $casts = [
        'rating' => 'integer',
        'status' => CommentStatus::class,
        'reviewed_at' => 'datetime',
    ];

    public function commentable(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')
            ->where('status', CommentStatus::Approved)
            ->orderBy('created_at');
    }

    public function isRoot(): bool
    {
        return $this->parent_id === null;
    }

    public function isGuest(): bool
    {
        return $this->user_id === null;
    }

    // Business rule: editable only within 1 hour of creation AND while
    // still pending moderation. Both conditions must hold.
    public function isEditable(): bool
    {
        return $this->status === CommentStatus::Pending
            && $this->created_at->addHour()->isFuture();
    }
    public function authorRole(): CommentAuthorRole
    {
        if ($this->user_id === null) {
            return CommentAuthorRole::Guest;
        }

        // Assumes User::user_type exists with values like 'staff'/'admin'/'customer'.
        // Confirmed earlier in the pricing/products backend reference.
        if ($this->user?->user_type === 'staff') {
            return CommentAuthorRole::Support;
        }

        return CommentAuthorRole::Member;
    }
}