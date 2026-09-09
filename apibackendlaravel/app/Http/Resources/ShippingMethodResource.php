<?php
// app/Http/Resources/ShippingMethodResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShippingMethodResource extends JsonResource
{
    // Public-facing shape: no base_cost/cost_per_kg here on purpose. The
    // actual price only comes from POST /shipping-quote so the storefront
    // never computes cost itself.
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'calculation_type' => $this->calculation_type->value,
            'free_shipping_enabled' => $this->free_shipping_enabled,
            'free_shipping_threshold' => $this->free_shipping_threshold,
            'estimated_days_min' => $this->estimated_days_min,
            'estimated_days_max' => $this->estimated_days_max,
        ];
    }
}