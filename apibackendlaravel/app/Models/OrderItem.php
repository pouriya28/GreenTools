<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price_snapshot' => 'integer',
        'subtotal_snapshot' => 'integer',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    // Intentionally nullable, non-cascading FK: if the product is later
    // deleted, this row (and the order history it represents) must survive.
    // Always read product_name_snapshot / unit_price_snapshot for display,
    // never rely on ->product being present.
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id_snapshot');
    }

    public function inventoryReservation(): BelongsTo
    {
        return $this->belongsTo(InventoryReservation::class);
    }
}