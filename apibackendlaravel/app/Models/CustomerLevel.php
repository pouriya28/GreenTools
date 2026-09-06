<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomerLevel extends Model
{
    protected $fillable = [
        'code', 'name', 'icon', 'min_points', 'max_points', 'sort_order', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function benefits(): HasMany
    {
        return $this->hasMany(CustomerLevelBenefit::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}