<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttributeValueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'attribute_id' => $this->attribute_id,
            'name' => $this->attribute->name,
            'unit' => $this->attribute->unit,
            'value' => $this->value,
            'sort_order' => $this->sort_order,
        ];
    }
}