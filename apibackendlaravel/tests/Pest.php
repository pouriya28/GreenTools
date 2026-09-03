<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->beforeEach(function () {
        // FAIL-SAFE: اگر محیط testing نباشد یا دیتابیس چیزی غیر از sqlite/:memory:
        // باشد، بلافاصله متوقف می‌شویم. هیچ تستی حق ندارد این چک را دور بزند.
        if (! app()->environment('testing')) {
            throw new RuntimeException(
                'SAFETY ABORT: Tests must only run in the testing environment. Current: '.app()->environment()
            );
        }

        if (config('database.default') !== 'sqlite' || config('database.connections.sqlite.database') !== ':memory:') {
            throw new RuntimeException(
                'SAFETY ABORT: Tests must use an isolated in-memory sqlite database. Refusing to run against: '
                .config('database.default').'/'.config('database.connections.sqlite.database')
            );
        }
    })
    ->in('Feature', 'Unit');
