<?php

namespace App\Services\Inventory;

use App\Models\InventoryReservation;
use App\Models\Product;

class StockAvailabilityService
{
    /**
     * True physical stock is stock_quantity minus quantity held by active
     * (unexpired, unconfirmed) reservations from other pending orders.
     */
    public function availableStock(Product $product): int
    {
        $reserved = InventoryReservation::where('product_id', $product->id)
            ->where('status', 'active')
            ->where('expires_at', '>', now())
            ->sum('quantity');

        return max(0, $product->stock_quantity - $reserved);
    }
}