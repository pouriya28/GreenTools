<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExchangeRate extends Model
{
    // نکته: source/reason/requested_by توسط مایگریشن
    // 2026_08_17_090100_add_manual_override_fields_to_exchange_rates_table
    // به جدول اضافه شدند و اینجا به $fillable افزوده شدند تا override دستی
    // ادمین (ExchangeRateOverrideController) و چک هفتگی خودکار
    // (RefreshExchangeRateJob) هر دو بتوانند این فیلدها را پر کنند.
    protected $fillable = [
        'rate', 'source', 'fetched_at', 'status', 'note', 'raw_response',
        'reason', 'requested_by',
    ];

    protected $casts = [
        'rate' => 'decimal:4',
        'fetched_at' => 'datetime',
    ];

    public function scopeApplied($query)
    {
        return $query->where('status', 'applied');
    }

    /**
     * نرخ‌هایی که ثبت شده‌اند اما پیشنهادهای قیمتشان هنوز توسط ادمین بررسی
     * نشده. هم چک هفتگی خودکار و هم override دستی، طبق تصمیم تایید‌شده،
     * همیشه از همین وضعیت شروع می‌کنند (بررسی هرگز رد نمی‌شود).
     */
    public function scopePendingReview($query)
    {
        return $query->where('status', 'pending_review');
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function proposals(): HasMany
    {
        return $this->hasMany(ProductPriceProposal::class);
    }
}
