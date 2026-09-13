<?php
// app/Http/Resources/OrderResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'total_amount' => $this->total_amount,
            'shipping_cost' => $this->shipping_cost,
            'shipping_method_name' => $this->shipping_method_name_snapshot,
            'created_at' => $this->created_at?->toISOString(),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'payment_status' => $this->whenLoaded(
                'payments',
                fn () => $this->payments->last()?->status->value,
            ),
            'address' => $this->whenLoaded('addressSnapshot', fn () => $this->addressSnapshot ? [
                'recipient_name' => $this->addressSnapshot->recipient_name,
                'recipient_phone' => $this->addressSnapshot->recipient_phone,
                'province_name' => $this->addressSnapshot->province_name,
                'city_name' => $this->addressSnapshot->city_name,
                'district' => $this->addressSnapshot->district,
                'postal_code' => $this->addressSnapshot->postal_code,
                'address_line' => $this->addressSnapshot->address_line,
                'plaque' => $this->addressSnapshot->plaque,
                'unit' => $this->addressSnapshot->unit,
                'latitude' => $this->addressSnapshot->latitude,
                'longitude' => $this->addressSnapshot->longitude,
            ] : null),
            'shipment' => $this->whenLoaded('shipment', fn () => $this->shipment ? [
                'status' => $this->shipment->status,
                'tracking_code' => $this->shipment->tracking_code,
                'shipped_at' => $this->shipment->shipped_at?->toISOString(),
                'delivered_at' => $this->shipment->delivered_at?->toISOString(),
            ] : null),
        ];
    }
}