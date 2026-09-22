<?php

$frontendOrigins = array_values(array_unique(array_filter(
    array_map(
        static fn ($origin): string => trim((string) $origin),
        explode(',', (string) env('FRONTEND_URLS', ''))
    ),
    static fn (string $origin): bool => $origin !== ''
)));

return [

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
    ],

    'allowed_methods' => [
        '*',
    ],

    'allowed_origins' => $frontendOrigins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        '*',
    ],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

    // Used by VerifyOriginForCookie.
    'frontend_origins' => $frontendOrigins,
];