<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $items = CartItemResource::collection($this->whenLoaded('items'));

        return [
            'id' => $this->id,
            'version' => $this->version,
            'items' => $items,
            'items_count' => $this->items->sum('quantity'),
            'subtotal' => $this->items->sum(
                fn ($item) => ($item->price_at_addition - $item->discount_at_addition) * $item->quantity
            ),
        ];
    }
}