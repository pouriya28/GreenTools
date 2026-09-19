<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

pest()
    ->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->beforeEach(function (): void {
        if (! app()->environment('testing')) {
            throw new RuntimeException(
                'SAFETY ABORT: Tests must only run in the testing environment. Current environment: '
                .app()->environment()
            );
        }

        $connection = (string) config('database.default');
        $database = (string) config("database.connections.{$connection}.database");

        if ($connection !== 'pgsql' || $database !== 'apibackendlaravel_test') {
            throw new RuntimeException(
                "SAFETY ABORT: Expected pgsql/apibackendlaravel_test, but received {$connection}/{$database}."
            );
        }
    })
    ->in('Feature');