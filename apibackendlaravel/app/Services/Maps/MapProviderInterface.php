<?php

namespace App\Services\Maps;

interface MapProviderInterface
{
    /**
     * @return array{province: ?string, city: ?string, district: ?string, address_line: ?string, place_id: ?string}
     */
    public function reverseGeocode(float $lat, float $lng): array;
}
