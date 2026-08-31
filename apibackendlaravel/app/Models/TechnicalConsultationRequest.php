<?php

namespace App\Models;

use App\Enums\TechnicalConsultationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TechnicalConsultationRequest extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'status' => TechnicalConsultationStatus::class,
        'approved_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // Staff member (user_type = staff) who approved/rejected the request —
    // required before CheckoutService will allow this order to proceed.
    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }
}