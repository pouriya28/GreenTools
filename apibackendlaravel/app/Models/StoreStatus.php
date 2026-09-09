<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreStatus extends Model
{
    // مثل Order/OrderAddressSnapshot: فقط از طریق StoreStatusService نوشته می‌شود،
    // هرگز مستقیماً از کنترلر mass-assign نمی‌شود.
    protected $guarded = ['id'];

    protected $casts = [
        'is_open' => 'boolean',
        'closed_at' => 'datetime',
    ];

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by_user_id');
    }
}
