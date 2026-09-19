<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
class Cart extends Model
{
    use HasUlids,HasFactory;

    protected $fillable = [
        'user_id',
        'guest_token',
        'status',
        'version',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'version' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function isGuest(): bool
    {
        return $this->user_id === null;
    }
}