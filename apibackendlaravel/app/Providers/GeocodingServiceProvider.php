<?php

namespace App\Providers;

use App\Services\Geocoding\GeocodingServiceInterface;
use App\Services\Geocoding\NeshanGeocodingService;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Support\ServiceProvider;

class GeocodingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(GeocodingServiceInterface::class, function ($app) {
            $driver = config('geocoding.default');

            // Only "neshan" is implemented today. Adding a new provider means
            // adding a case here and a new class under Services/Geocoding --
            // no other file in the app needs to change.
            return match ($driver) {
                'neshan' => new NeshanGeocodingService(
                    $app->make(HttpFactory::class),
                    config('geocoding.neshan'),
                ),
                default => throw new \RuntimeException("Unsupported geocoding driver [{$driver}]."),
            };
        });
    }
}
