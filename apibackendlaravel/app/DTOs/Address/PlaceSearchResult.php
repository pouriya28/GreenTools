<?php

namespace App\DTOs\Address;

final class PlaceSearchResult
{
    public function __construct(
        public readonly string $title,
        public readonly string $address,
        public readonly string $region,
        public readonly ?string $neighbourhood,
        public readonly string $category,
        public readonly string $type,
        public readonly float $latitude,
        public readonly float $longitude,
    ) {
    }

    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'address' => $this->address,
            'region' => $this->region,
            'neighbourhood' => $this->neighbourhood,
            'category' => $this->category,
            'type' => $this->type,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
        ];
    }
}