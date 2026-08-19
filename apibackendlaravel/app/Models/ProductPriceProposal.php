<?php

namespace App\Models;

use App\Enums\PriceProposalStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductPriceProposal extends Model
{
    protected $fillable = [
        'batch_id', 'exchange_rate_id', 'product_id',
        'old_price_toman', 'new_price_toman', 'edited_price_toman',
        'status', 'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        'old_price_toman' => 'integer',
        'new_price_toman' => 'integer',
        'edited_price_toman' => 'integer',
        'status' => PriceProposalStatus::class,
        'reviewed_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function exchangeRate(): BelongsTo
    {
        return $this->belongsTo(ExchangeRate::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /** مقدار نهایی که در صورت approve روی محصول ست می‌شود: اصلاح دستی ادمین در اولویت است. */
    public function getEffectivePriceTomanAttribute(): int
    {
        return $this->edited_price_toman ?? $this->new_price_toman;
    }
}
