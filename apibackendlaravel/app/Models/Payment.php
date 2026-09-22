<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Relations\HasOne;
class Payment extends Model
{
    use HasUlids;
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

    public function latestAttempt(): HasOne
    {
        return $this->hasOne(PaymentAttempt::class)->latestOfMany('id');
    }
    public function transitionTo(PaymentStatus $next): void
    {
        if (! $this->status->canTransitionTo($next)) {
            throw new \App\Exceptions\Payment\InvalidPaymentTransitionException($this->status, $next);
        }

        $this->update(['status' => $next]);
    }
}