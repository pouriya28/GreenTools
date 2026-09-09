<?php
// app/Http/Resources/ShippingQuoteResource.php

namespace App\Http\Resources;

use App\Services\Shipping\ShippingQuote;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @property ShippingQuote $resource */
class ShippingQuoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'shipping_method_id' => $this->resource->shippingMethodId,
            'method_name' => $this->resource->methodName,
            'calculation_type' => $this->resource->calculationType,
            'cost' => $this->resource->cost,
            'is_free_shipping' => $this->resource->isFreeShipping,
            'estimated_days_min' => $this->resource->estimatedDaysMin,
            'estimated_days_max' => $this->resource->estimatedDaysMax,
        ];
    }
}