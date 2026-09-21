<?php

use Illuminate\Support\Facades\Route;

beforeEach(function (): void {
    Route::middleware('verify.origin')->post(
        '/api/testing/origin-protected',
        static fn () => response()->json(['ok' => true])
    );
});

it('fails closed when frontend origins are not configured', function (): void {
    config([
        'cors.frontend_origins' => [],
    ]);

    $response = $this
        ->withHeader('Origin', 'https://shop.example.com')
        ->postJson('/api/testing/origin-protected');

    $response
        ->assertStatus(503)
        ->assertJsonPath('code', 'ORIGIN_CONFIGURATION_MISSING');
});

it('allows an exact configured origin', function (): void {
    config([
        'cors.frontend_origins' => [
            'https://shop.example.com',
        ],
    ]);

    $response = $this
        ->withHeader('Origin', 'https://shop.example.com')
        ->postJson('/api/testing/origin-protected');

    $response
        ->assertOk()
        ->assertJson([
            'ok' => true,
        ]);
});

it('trims configured origins before comparison', function (): void {
    config([
        'cors.frontend_origins' => [
            '  https://shop.example.com  ',
        ],
    ]);

    $response = $this
        ->withHeader('Origin', 'https://shop.example.com')
        ->postJson('/api/testing/origin-protected');

    $response
        ->assertOk()
        ->assertJson([
            'ok' => true,
        ]);
});

it('rejects an origin that only starts with an allowed origin', function (): void {
    config([
        'cors.frontend_origins' => [
            'https://shop.example.com',
        ],
    ]);

    $response = $this
        ->withHeader('Origin', 'https://shop.example.com.attacker.test')
        ->postJson('/api/testing/origin-protected');

    $response
        ->assertStatus(403)
        ->assertJsonPath('code', 'ORIGIN_NOT_ALLOWED');
});

it('accepts a referer path when its origin is allowed', function (): void {
    config([
        'cors.frontend_origins' => [
            'https://shop.example.com',
        ],
    ]);

    $response = $this
        ->withHeader(
            'Referer',
            'https://shop.example.com/account/settings?tab=security'
        )
        ->postJson('/api/testing/origin-protected');

    $response
        ->assertOk()
        ->assertJson([
            'ok' => true,
        ]);
});

it('rejects a request without origin or referer', function (): void {
    config([
        'cors.frontend_origins' => [
            'https://shop.example.com',
        ],
    ]);

    $response = $this->postJson('/api/testing/origin-protected');

    $response
        ->assertStatus(403)
        ->assertJsonPath('code', 'ORIGIN_HEADER_MISSING');
});