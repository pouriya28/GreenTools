<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->name,
            'product_slug' => $this->product?->slug,
            'image_url' => $this->product?->primaryImage?->url,
            'quantity' => $this->quantity,
            'unit_price' => $this->price_at_addition,
            'unit_discount' => $this->discount_at_addition,
            'line_total' => ($this->price_at_addition - $this->discount_at_addition) * $this->quantity,
            'purchase_requirement' => $this->purchase_requirement_at_addition,
            'purchase_confirmed' => $this->purchase_confirmed,
            // Surfaces a price-change/availability signal without recalculating on the frontend.
            'price_changed' => $this->product !== null && $this->product->price_toman !== $this->price_at_addition,
            'in_stock' => $this->product !== null && $this->product->stock_quantity >= $this->quantity,
        ];
    }
}