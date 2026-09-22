<?php
// app/Models/ShippingMethod.php

namespace App\Models;

use App\Enums\ShippingCalculationType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
class ShippingMethod extends Model
{
    use HasUlids,HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'base_cost',
        'calculation_type',
        'cost_per_kg',
        'min_weight_grams',
        'max_weight_grams',
        'free_shipping_enabled',
        'free_shipping_threshold',
        'estimated_days_min',
        'estimated_days_max',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'calculation_type' => ShippingCalculationType::class,
        'base_cost' => 'integer',
        'cost_per_kg' => 'integer',
        'min_weight_grams' => 'integer',
        'max_weight_grams' => 'integer',
        'free_shipping_enabled' => 'boolean',
        'free_shipping_threshold' => 'integer',
        'estimated_days_min' => 'integer',
        'estimated_days_max' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function coversWeight(int $weightGrams): bool
    {
        if ($this->min_weight_grams !== null && $weightGrams < $this->min_weight_grams) {
            return false;
        }

        if ($this->max_weight_grams !== null && $weightGrams > $this->max_weight_grams) {
            return false;
        }

        return true;
    }
}
