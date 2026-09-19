<?php

namespace App\Models;

use App\Enums\DiscountType;
use App\Enums\PurchaseRequirement;
use App\Models\Concerns\HasMeta;
use App\Models\Concerns\HasTags;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
class Product extends Model
{
    use HasUlids, HasFactory, SoftDeletes, HasTags, HasMeta;
    protected $fillable = [
        'category_id', 'name', 'slug', 'sku', 'short_description', 'description',
        'price_usd', // price_toman عمداً اینجا نیست - فقط از طریق PricingService/Job نوشته می‌شه
        'discount_type', 'discount_value', 'discount_starts_at', 'discount_ends_at',
        'stock_quantity', 'stock_status', 'weight_grams',
        'is_active', 'is_featured', 'created_by', 'updated_by',
        'purchase_requirement', 'technical_notice', 'installation_notice',
        'compatibility_notice', 'support_contact_enabled', 'purchase_confirmation_required',
    ];

    protected $casts = [
        'price_usd' => 'decimal:2',
        'price_toman' => 'integer',
        'discount_type' => DiscountType::class,
        'discount_value' => 'integer',
        'discount_starts_at' => 'datetime',
        'discount_ends_at' => 'datetime',
        'stock_quantity' => 'integer',
        'weight_grams' => 'integer',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'views_count' => 'integer',
        'stock_status' => \App\Enums\StockStatus::class,
        'purchase_requirement' => PurchaseRequirement::class,
        'support_contact_enabled' => 'boolean',
        'purchase_confirmation_required' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function videos(): HasMany
    {
        return $this->hasMany(ProductVideo::class)->orderBy('sort_order');
    }

    public function primaryImage(): HasOne
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true);
    }
    public function attributeValues(): HasMany
    {
        return $this->hasMany(ProductAttributeValue::class)
            ->with('attribute')
            ->orderBy('sort_order');
    }

    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    // این سه accessor حالا فقط wrapper دور PricingService هستن تا Resource ها بدون تغییر کار کنن
    public function getHasActiveDiscountAttribute(): bool
    {
        return app(\App\Services\Pricing\PricingService::class)->hasActiveDiscount($this);
    }

    public function getFinalPriceAttribute(): int
    {
        return app(\App\Services\Pricing\PricingService::class)->computeFinalPrice($this);
    }

    public function getDiscountPercentageAttribute(): ?int
    {
        if (! $this->has_active_discount || $this->price_toman <=0){
            return null;
        }

        return (int) round((($this->price_toman - $this->final_price) / $this->price_toman) * 100);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInStock($query)
    {
        return $query->where('stock_status', '!=', 'out_of_stock')->where('stock_quantity', '>', 0);
    }
}