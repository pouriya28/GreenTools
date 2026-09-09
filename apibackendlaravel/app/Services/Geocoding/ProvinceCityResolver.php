<?php

namespace App\Services\Geocoding;

use App\Models\City;
use App\Models\Province;

/**
 * Maps free-text province/city names returned by an external geocoding
 * provider onto our internal provinces/cities tables. Never trust the
 * external name directly -- always resolve to an ID, and return null when
 * unsure so the caller can fall back to manual selection instead of
 * silently assigning the wrong city.
 */
class ProvinceCityResolver
{
    public function resolveProvince(?string $name): ?Province
    {
        if ($name === null || trim($name) === '') {
            return null;
        }

        return Province::query()
            ->whereRaw('TRIM(name) = ?', [trim($name)])
            ->first();
    }

    public function resolveCity(?string $name, ?int $provinceId): ?City
    {
        if ($name === null || trim($name) === '') {
            return null;
        }

        $query = City::query()->whereRaw('TRIM(name) = ?', [trim($name)]);

        if ($provinceId !== null) {
            $query->where('province_id', $provinceId);
        }

        // If more than one city matches (ambiguous without province context),
        // refuse to guess -- return null so the frontend asks the user.
        $matches = $query->limit(2)->get();

        return $matches->count() === 1 ? $matches->first() : null;
    }
}
