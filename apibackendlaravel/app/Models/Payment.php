<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'status' => PaymentStatus::class,
        'amount' => 'integer',
        'paid_at' => 'datetime',
    ];

    // Never mass-assignable via normal create/update — only the webhook
    // handler (inside a locked transaction) should ever write these.
    protected $hidden = ['gateway_secret_reference'];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(PaymentAttempt::class);
    }

    public function latestAttempt(): ?PaymentAttempt
    {
        return $this->attempts()->latest('id')->first();
    }
}