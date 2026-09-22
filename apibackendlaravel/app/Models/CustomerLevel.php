<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
class CustomerLevel extends Model
{
    use HasUlids;
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