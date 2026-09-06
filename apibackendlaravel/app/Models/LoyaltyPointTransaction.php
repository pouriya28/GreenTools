<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoyaltyPointTransaction extends Model
{
    // This ledger is immutable and insert-only. There is no updated_at
    // column, and no code path should ever call update()/delete() on it —
    // corrections must be recorded as a new transaction, never an edit.
    public const UPDATED_AT = null;

    protected $fillable = [
        'user_id', 'type', 'points', 'reference_type', 'reference_id', 'description', 'granted_by',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function grantedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'granted_by');
    }
}