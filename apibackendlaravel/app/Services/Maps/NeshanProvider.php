<?php

namespace App\Services\Maps;

use Illuminate\Support\Facades\Http;

class NeshanProvider implements MapProviderInterface
{
    public function __construct(private readonly string $apiKey)
    {
    }

    public function reverseGeocode(float $lat, float $lng): array
    {
        $data = Http::withHeaders(['Api-Key' => $this->apiKey])
            ->get('https://api.neshan.org/v5/reverse', [
                'lat' => $lat,
                'lng' => $lng,
            ])
            ->throw()
            ->json();

        return [
            'province' => $data['province'] ?? null,
            'city' => $data['city'] ?? null,
            'district' => $data['neighbourhood'] ?? null,
            'address_line' => $data['formatted_address'] ?? null,
            'place_id' => null,
        ];
    }
}
