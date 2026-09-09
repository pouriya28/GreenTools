<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderAddressSnapshot extends Model
{
    // مثل Order: guarded نه fillable — فقط از AddressService::createSnapshot() و
    // داخل Transaction ساخت سفارش نوشته می‌شود، هرگز از ورودی مستقیم کنترلر.
    protected $guarded = ['id'];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function address(): BelongsTo
    {
        return $this->belongsTo(Address::class);
    }
}
