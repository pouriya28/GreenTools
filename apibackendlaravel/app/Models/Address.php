<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
class Address extends Model
{
    use HasUlids,HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'recipient_name',
        'recipient_phone',
        'province_id',
        'city_id',
        'district',
        'postal_code',
        'address_line',
        'plaque',
        'unit',
        'latitude',
        'longitude',
        'map_provider',
        'map_place_id',
        'is_default',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'is_default' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function province(): BelongsTo
    {
        return $this->belongsTo(Province::class);
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }
}
