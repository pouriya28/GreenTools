<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'cart_id',
        'product_id',
        'quantity',
        'price_at_addition',
        'discount_at_addition',
        'purchase_requirement_at_addition',
        'purchase_confirmed',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'price_at_addition' => 'integer',
        'discount_at_addition' => 'integer',
        'purchase_confirmed' => 'boolean',
    ];

    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}