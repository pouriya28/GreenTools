<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class RateLimiterServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Reverse geocoding is interactive (map clicks/drags) but proxies a
        // paid external API, so it gets its own, tighter limiter than
        // general API endpoints. Keyed per authenticated user.
        RateLimiter::for('reverse-geocode', function ($request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });
    }
}
