<?php

namespace App\DTOs\Address;

/**
 * Normalized, provider-agnostic reverse-geocoding result.
 *
 * Only carries the fields the address form actually needs (province, city,
 * street, neighborhood). Never expose the raw provider response to the
 * frontend; always pass through this DTO so a provider swap
 * (Neshan -> map.ir -> Google) never changes the shape the frontend
 * depends on.
 */
final class ReverseGeocodeResult
{
    public function __construct(
        public readonly float $latitude,
        public readonly float $longitude,
        public readonly ?string $formattedAddress,
        public readonly ?string $provinceName,
        public readonly ?string $cityName,
        public readonly ?string $neighbourhood,
        public readonly ?string $street,
    ) {
    }
}
