<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StoreStatusResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'is_open' => $this->is_open,
            'closed_reason' => $this->closed_reason,
            'closed_by_user_id' => $this->closed_by_user_id,
            'closed_at' => $this->closed_at?->toIso8601String(),
        ];
    }
}