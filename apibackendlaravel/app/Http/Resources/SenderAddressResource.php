<?php
// app/Http/Resources/SenderAddressResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SenderAddressResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'sender_name' => $this->sender_name,
            'sender_phone' => $this->sender_phone,
            'province_name' => $this->province_name,
            'city_name' => $this->city_name,
            'district' => $this->district,
            'postal_code' => $this->postal_code,
            'address_line' => $this->address_line,
            'plaque' => $this->plaque,
            'unit' => $this->unit,
            'is_default' => $this->is_default,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}