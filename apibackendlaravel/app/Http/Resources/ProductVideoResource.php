<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVideoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'source_type' => $this->source_type,
            'url' => $this->source_type === 'upload' ? $this->url : $this->external_url,
            'external_id' => $this->external_id,
            'thumbnail_url' => $this->thumbnail_url,
            'title' => $this->title,
            'sort_order' => $this->sort_order,
        ];
    }
}