<?php
// app/Http/Resources/OrderListResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'total_amount' => $this->total_amount,
            'items_count' => $this->items_count,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}