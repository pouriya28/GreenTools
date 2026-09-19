<?php

use App\Providers\TestingServiceProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

it('runs only against the isolated PostgreSQL test database', function (): void {
    $activeDatabase = DB::selectOne(
        'select current_database() as database_name'
    )->database_name;

    expect(app()->environment())->toBe('testing')
        ->and(config('database.default'))->toBe('pgsql')
        ->and(config('database.connections.pgsql.database'))->toBe('apibackendlaravel_test')
        ->and($activeDatabase)->toBe('apibackendlaravel_test')
        ->and(Schema::hasTable('migrations'))->toBeTrue()
        ->and(Schema::hasTable('users'))->toBeTrue();
});

it('rejects an unsafe database through the testing provider', function (): void {
    $originalDatabase = config('database.connections.pgsql.database');

    try {
        config()->set('database.connections.pgsql.database', 'shop_db');

        expect(
            fn () => (new TestingServiceProvider(app()))->register()
        )->toThrow(RuntimeException::class);
    } finally {
        config()->set(
            'database.connections.pgsql.database',
            $originalDatabase
        );
    }
});