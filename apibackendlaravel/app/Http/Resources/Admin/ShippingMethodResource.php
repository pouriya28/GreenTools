<?php
// app/Http/Resources/Admin/ShippingMethodResource.php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShippingMethodResource extends JsonResource
{
    // Full shape for the admin panel, including internal pricing fields.
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'base_cost' => $this->base_cost,
            'calculation_type' => $this->calculation_type->value,
            'cost_per_kg' => $this->cost_per_kg,
            'min_weight_grams' => $this->min_weight_grams,
            'max_weight_grams' => $this->max_weight_grams,
            'free_shipping_enabled' => $this->free_shipping_enabled,
            'free_shipping_threshold' => $this->free_shipping_threshold,
            'estimated_days_min' => $this->estimated_days_min,
            'estimated_days_max' => $this->estimated_days_max,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}