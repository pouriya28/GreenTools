<?php

namespace App\Services\Geocoding;

use App\DTOs\Address\PlaceSearchResult;
use App\DTOs\Address\ReverseGeocodeResult;
use App\Exceptions\Geocoding\PlaceSearchFailedException;
use App\Exceptions\Geocoding\ReverseGeocodingFailedException;

interface GeocodingServiceInterface
{
    /**
     * @throws ReverseGeocodingFailedException when the provider cannot resolve
     *         an address (timeout, invalid key, provider outage, malformed response).
     */
    public function reverseGeocode(float $latitude, float $longitude): ReverseGeocodeResult;

    /**
     * @return PlaceSearchResult[]
     * @throws PlaceSearchFailedException when the provider cannot resolve
     *         search results (timeout, invalid key, provider outage, malformed response).
     */
    public function searchPlaces(string $term, float $latitude, float $longitude): array;
}