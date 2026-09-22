<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use RuntimeException;

class TestingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        if (! $this->app->environment('testing')) {
            return;
        }

        $connection = (string) config('database.default');
        $database = (string) config("database.connections.{$connection}.database");

        if ($connection !== 'pgsql') {
            throw new RuntimeException(
                "SAFETY ABORT: Testing requires the pgsql connection; {$connection} was configured."
            );
        }

        if ($database !== 'apibackendlaravel_test') {
            throw new RuntimeException(
                "SAFETY ABORT: Refusing to test against database '{$database}'."
            );
        }
    }
}