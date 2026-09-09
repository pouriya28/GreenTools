<?php

return [
    // Which provider implementation is bound to GeocodingServiceInterface.
    // Kept separate from the driver name so swapping providers later
    // (e.g. to Google Maps or map.ir) does not require touching the Address module.
    'default' => env('GEOCODING_DRIVER', 'neshan'),

    'neshan' => [
        'base_url' => env('NESHAN_BASE_URL', 'https://api.neshan.org'),
        'api_key' => env('NESHAN_API_KEY'),
        'connect_timeout' => (float) env('NESHAN_CONNECT_TIMEOUT', 3),
        'timeout' => (float) env('NESHAN_TIMEOUT', 5),
        'retry_times' => (int) env('NESHAN_RETRY_TIMES', 1),
        'retry_delay_ms' => (int) env('NESHAN_RETRY_DELAY_MS', 200),
    ],

    // Reverse-geocoding result cache. Coordinates are rounded before building
    // the cache key, so nearby clicks reuse the same cached address.
    'cache' => [
        'enabled' => (bool) env('GEOCODING_CACHE_ENABLED', true),
        'store' => env('GEOCODING_CACHE_STORE', null), // null = default cache store
        'ttl_minutes' => (int) env('GEOCODING_CACHE_TTL_MINUTES', 43200), // 30 days
        'coordinate_precision' => (int) env('GEOCODING_CACHE_PRECISION', 5), // ~1.1m
    ],

    // Generous bounding box around Iran (including islands/border areas) used
    // as a coarse sanity check. The backend remains the final authority; this
    // only rejects coordinates that are clearly outside the country.
    'iran_bounds' => [
        'lat_min' => 24.0,
        'lat_max' => 40.5,
        'lng_min' => 43.5,
        'lng_max' => 63.5,
    ],
];
