<?php

namespace App\Http\Controllers\Api\V1\Address;

use App\DTOs\Address\ReverseGeocodeResult;
use App\Exceptions\Geocoding\ReverseGeocodingFailedException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Map\ReverseGeocodeRequest;
use App\Http\Responses\ApiResponse;
use App\Services\Geocoding\GeocodingServiceInterface;
use App\Services\Geocoding\ProvinceCityResolver;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Exceptions\Geocoding\PlaceSearchFailedException;
use App\Http\Requests\Api\V1\Map\SearchPlacesRequest;
class MapController extends Controller
{
    public function __construct(
        private readonly GeocodingServiceInterface $geocodingService,
        private readonly ProvinceCityResolver $provinceCityResolver,
    ) {
    }

    public function reverseGeocode(ReverseGeocodeRequest $request)
    {
        $latitude = (float) $request->validated('latitude');
        $longitude = (float) $request->validated('longitude');

        try {
            $result = $this->remember($latitude, $longitude, function () use ($latitude, $longitude) {
                return $this->geocodingService->reverseGeocode($latitude, $longitude);
            });
        } catch (ReverseGeocodingFailedException $e) {
            // The exception message is already safe/user-facing; no internals leak.
            return ApiResponse::error(message: $e->getMessage(),code: 'REVERSE_GEOCODING_FAILED', status: 422);
        }

        $province = $this->provinceCityResolver->resolveProvince($result->provinceName);
        $city = $this->provinceCityResolver->resolveCity($result->cityName, $province?->id);

        return ApiResponse::success([
            'latitude' => $result->latitude,
            'longitude' => $result->longitude,
            'formatted_address' => $result->formattedAddress,
            'province' => $province ? ['id' => $province->id, 'name' => $province->name] : null,
            'city' => $city ? ['id' => $city->id, 'name' => $city->name] : null,
            'neighborhood' => $result->neighbourhood,
            'street' => $result->street,
            // Surface this explicitly so the frontend knows to fall back to
            // manual province/city selection instead of guessing.
            'requires_manual_location' => $province === null || $city === null,
        ]);
    }

    private function remember(float $latitude, float $longitude, \Closure $resolve): ReverseGeocodeResult
    {
        $cacheConfig = config('geocoding.cache');

        if (! ($cacheConfig['enabled'] ?? true)) {
            return $resolve();
        }

        $precision = $cacheConfig['coordinate_precision'] ?? 5;
        $key = sprintf(
            'geocoding:reverse:%s:%s',
            round($latitude, $precision),
            round($longitude, $precision),
        );

        return Cache::store($cacheConfig['store'] ?? null)->remember(
            $key,
            now()->addMinutes($cacheConfig['ttl_minutes'] ?? 43200),
            function () use ($resolve, $latitude, $longitude) {
                // Coordinates are only logged when we actually call the external
                // provider (cache misses), keeping location logging minimal.
                Log::info('Reverse geocoding cache miss.', ['lat' => $latitude, 'lng' => $longitude]);

                return $resolve();
            },
        );
    }
    public function search(SearchPlacesRequest $request)
    {
        $term = $request->validated('term');
        $latitude = (float) $request->validated('latitude');
        $longitude = (float) $request->validated('longitude');

        try {
            $results = $this->geocodingService->searchPlaces($term, $latitude, $longitude);
        } catch (PlaceSearchFailedException $e) {
            return ApiResponse::error(message: $e->getMessage(), code: 'PLACE_SEARCH_FAILED', status: 422);
        }

        return ApiResponse::success(array_map(fn ($r) => $r->toArray(), $results));
    }
}
