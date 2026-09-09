<?php

namespace App\Services\Maps;

use Illuminate\Support\Facades\Http;

class MapIrProvider implements MapProviderInterface
{
    public function __construct(private readonly string $apiKey)
    {
    }

    public function reverseGeocode(float $lat, float $lng): array
    {
        $data = Http::withHeaders(['x-api-key' => $this->apiKey])
            ->get('https://map.ir/reverse', [
                'lat' => $lat,
                'lon' => $lng,
            ])
            ->throw()
            ->json();

        return [
            'province' => $data['province'] ?? null,
            'city' => $data['city'] ?? null,
            'district' => $data['district'] ?? null,
            'address_line' => $data['address'] ?? null,
            'place_id' => $data['geom']['place_id'] ?? null,
        ];
    }
}
