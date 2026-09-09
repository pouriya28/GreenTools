<?php

namespace App\Services\Geocoding;

use App\DTOs\Address\ReverseGeocodeResult;
use App\Exceptions\Geocoding\ReverseGeocodingFailedException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Support\Facades\Log;
use App\DTOs\Address\PlaceSearchResult;
use App\Exceptions\Geocoding\PlaceSearchFailedException;
/**
 * Neshan implementation of GeocodingServiceInterface.
 *
 * Endpoint and response shape verified against the official docs
 * (https://platform.neshan.org/docs/api/search-category/reverse-geocoding/):
 *
 *   GET https://api.neshan.org/v5/reverse?lat=...&lng=...
 *   Header: Api-Key: <key>
 *   200 -> { status: "OK", formatted_address, route_name, route_type,
 *            neighbourhood, city, state, place, municipality_zone,
 *            in_traffic_zone, in_odd_even_zone, village, county, district }
 *
 * Documented error HTTP codes: 400 INVALID_ARGUMENT, 470 CoordinateParseError,
 * 480 KeyNotFound, 481 LimitExceeded, 482 RateExceeded, 483 ApiKeyTypeError,
 * 484 ApiWhiteListError, 485 ApiServiceListError, 500 GenericError.
 */
class NeshanGeocodingService implements GeocodingServiceInterface
{
    public function __construct(
        private readonly HttpFactory $http,
        private readonly array $config,
    ) {
    }

    public function reverseGeocode(float $latitude, float $longitude): ReverseGeocodeResult
    {
        $apiKey = $this->config['api_key'] ?? null;

        if (empty($apiKey)) {
            // Never leak "why" to the client; log server-side only.
            Log::error('Neshan reverse geocoding attempted without an API key configured.');

            throw ReverseGeocodingFailedException::providerUnavailable();
        }

        try {
            $response = $this->http
                ->withHeaders(['Api-Key' => $apiKey])
                ->connectTimeout($this->config['connect_timeout'] ?? 3)
                ->timeout($this->config['timeout'] ?? 5)
                ->retry(
                    $this->config['retry_times'] ?? 1,
                    $this->config['retry_delay_ms'] ?? 200,
                    throw: false,
                )
                ->get(rtrim($this->config['base_url'], '/') . '/v5/reverse', [
                    // Only ever forward the two explicit parameters we validated.
                    // Never forward arbitrary client-supplied query params to Neshan.
                    'lat' => $latitude,
                    'lng' => $longitude,
                ]);
        } catch (ConnectionException $e) {
            Log::warning('Neshan reverse geocoding connection failure.', ['exception' => $e->getMessage()]);

            throw ReverseGeocodingFailedException::timedOut();
        }

        if ($response->successful()) {
            $body = $response->json();

            if (! is_array($body) || ($body['status'] ?? null) !== 'OK') {
                throw ReverseGeocodingFailedException::malformedResponse();
            }

            return $this->map($latitude, $longitude, $body);
        }

        throw $this->exceptionForStatus($response->status(), $response->json());
    }
    public function searchPlaces(string $term, float $latitude, float $longitude): array
    {
        $apiKey = $this->config['api_key'] ?? null;
        if (empty($apiKey)) {
            Log::error('Neshan place search attempted without an API key configured.');
            throw PlaceSearchFailedException::providerUnavailable();
        }

        $query = json_encode([
            'term' => $term,
            'center' => ['latitude' => $latitude, 'longitude' => $longitude],
        ], JSON_UNESCAPED_UNICODE);

        try {
            $response = $this->http
                ->withHeaders(['Api-Key' => $apiKey])
                ->connectTimeout($this->config['connect_timeout'] ?? 3)
                ->timeout($this->config['timeout'] ?? 5)
                ->retry(
                    $this->config['retry_times'] ?? 1,
                    $this->config['retry_delay_ms'] ?? 200,
                    throw: false,
                )
                ->get(rtrim($this->config['base_url'], '/') . '/v3/search', ['q' => $query]);
        } catch (ConnectionException $e) {
            Log::warning('Neshan place search connection failure.', ['exception' => $e->getMessage()]);
            throw PlaceSearchFailedException::timedOut();
        }

        if (! $response->successful()) {
            $providerStatus = $response->json('status');
            throw match ($response->status()) {
                400, 470 => tap(PlaceSearchFailedException::invalidQuery(), function () use ($response, $providerStatus) {
                    Log::info('Neshan rejected search query.', ['http_status' => $response->status(), 'provider_status' => $providerStatus]);
                }),
                480, 483, 484, 485 => tap(PlaceSearchFailedException::providerUnavailable(), function () use ($response, $providerStatus) {
                    Log::error('Neshan API key/configuration error (search).', ['http_status' => $response->status(), 'provider_status' => $providerStatus]);
                }),
                481, 482 => tap(PlaceSearchFailedException::rateLimited(), function () use ($response, $providerStatus) {
                    Log::warning('Neshan rate/quota limit hit (search).', ['http_status' => $response->status(), 'provider_status' => $providerStatus]);
                }),
                default => tap(PlaceSearchFailedException::providerUnavailable(), function () use ($response, $providerStatus) {
                    Log::warning('Neshan place search request failed.', ['http_status' => $response->status(), 'provider_status' => $providerStatus]);
                }),
            };
        }

        $body = $response->json();
        if (! is_array($body) || ! isset($body['items']) || ! is_array($body['items'])) {
            throw PlaceSearchFailedException::malformedResponse();
        }

        return array_map(function (array $item) {
            return new PlaceSearchResult(
                title: (string) ($item['title'] ?? ''),
                address: (string) ($item['address'] ?? ''),
                region: (string) ($item['region'] ?? ''),
                neighbourhood: $this->stringOrNull($item['neighbourhood'] ?? null),
                category: (string) ($item['category'] ?? ''),
                type: (string) ($item['type'] ?? ''),
                latitude: (float) ($item['location']['y'] ?? 0),
                longitude: (float) ($item['location']['x'] ?? 0),
            );
        }, $body['items']);
    }
    /**
     * Map Neshan's documented HTTP error codes to safe, user-facing
     * exceptions. Technical detail (the raw provider status/body) is only
     * ever logged server-side, never returned to the client.
     */
    private function exceptionForStatus(int $status, mixed $body): ReverseGeocodingFailedException
    {
        $providerStatus = is_array($body) ? ($body['status'] ?? null) : null;

        return match ($status) {
            400, 470 => tap(ReverseGeocodingFailedException::invalidCoordinates(), function () use ($status, $providerStatus) {
                Log::info('Neshan rejected coordinates.', ['http_status' => $status, 'provider_status' => $providerStatus]);
            }),
            480, 483, 484, 485 => tap(ReverseGeocodingFailedException::providerUnavailable(), function () use ($status, $providerStatus) {
                // Configuration problem on our side (bad/mismatched key or scope) --
                // needs developer attention, so log at error level.
                Log::error('Neshan API key/configuration error.', ['http_status' => $status, 'provider_status' => $providerStatus]);
            }),
            481, 482 => tap(ReverseGeocodingFailedException::rateLimited(), function () use ($status, $providerStatus) {
                Log::warning('Neshan rate/quota limit hit.', ['http_status' => $status, 'provider_status' => $providerStatus]);
            }),
            default => tap(ReverseGeocodingFailedException::providerUnavailable(), function () use ($status, $providerStatus) {
                Log::warning('Neshan reverse geocoding request failed.', ['http_status' => $status, 'provider_status' => $providerStatus]);
            }),
        };
    }

    /**
     * Safely normalize the raw Neshan payload into our DTO. Every optional
     * field defaults to null -- Neshan may omit province/city/neighbourhood
     * for rural or edge coordinates, and we must not assume completeness.
     */
    private function map(float $latitude, float $longitude, array $body): ReverseGeocodeResult
    {
        // Neshan returns additional fields (county, district, place,
        // municipality_zone, in_traffic_zone, in_odd_even_zone, village) that
        // are intentionally not surfaced -- the address form only needs
        // province, city, street, and neighborhood.
        return new ReverseGeocodeResult(
            latitude: $latitude,
            longitude: $longitude,
            formattedAddress: $this->stringOrNull($body['formatted_address'] ?? null),
            provinceName: $this->stringOrNull($body['state'] ?? null),
            cityName: $this->stringOrNull($body['city'] ?? null),
            neighbourhood: $this->stringOrNull($body['neighbourhood'] ?? null),
            street: $this->stringOrNull($body['route_name'] ?? null),
        );
    }

    private function stringOrNull(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }
}
