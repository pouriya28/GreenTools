<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Attribute extends Model
{
    use HasUlids;

    protected $fillable = ['name', 'unit', 'sort_order'];

    public function values(): HasMany
    {
        return $this->hasMany(ProductAttributeValue::class);
    }
}