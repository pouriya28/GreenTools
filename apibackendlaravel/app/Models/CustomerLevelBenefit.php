<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerLevelBenefit extends Model
{
    protected $fillable = ['customer_level_id', 'type', 'value', 'is_active'];

    protected function casts(): array
    {
        return [
            'value' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function customerLevel(): BelongsTo
    {
        return $this->belongsTo(CustomerLevel::class);
    }
}