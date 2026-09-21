<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

function postTokenRefreshThrottleTestRequest(
    object $testCase,
    ?string $refreshToken = null
) {
    $cookies = $refreshToken === null
        ? []
        : ['refresh_token' => $refreshToken];

    return $testCase->call(
        'POST',
        '/api/testing/token-refresh-throttle',
        [],
        $cookies,
        [],
        [
            'HTTP_ACCEPT' => 'application/json',
            'CONTENT_TYPE' => 'application/json',
        ],
        json_encode([], JSON_THROW_ON_ERROR)
    );
}

beforeEach(function (): void {
    Cache::flush();

    Route::get(
        '/api/testing/client-ip',
        static fn (Request $request) => response()->json([
            'ip' => $request->ip(),
        ])
    );

    Route::middleware('throttle:token-refresh')->post(
        '/api/testing/token-refresh-throttle',
        static function (Request $request) {
            $token = (string) $request->cookie('refresh_token', '');

            return response()->json([
                'ok' => true,
                'token_hash' => hash('sha256', $token),
            ]);
        }
    );
});

it('blocks replay attempts after the same refresh token exceeds its limit', function (): void {
    $token = 'same-refresh-token-'.Str::random(32);
    $expectedHash = hash('sha256', $token);

    for ($attempt = 1; $attempt <= 30; $attempt++) {
        $response = postTokenRefreshThrottleTestRequest($this, $token);

        $response
            ->assertOk()
            ->assertJsonPath('token_hash', $expectedHash);
    }

    $response = postTokenRefreshThrottleTestRequest($this, $token);

    $response
        ->assertStatus(429)
        ->assertJsonPath('code', 'RATE_LIMITED');
});

it('does not allow token rotation to bypass the stable IP limit', function (): void {
    for ($attempt = 1; $attempt <= 60; $attempt++) {
        $rotatedToken = 'rotated-refresh-token-'.$attempt.'-'.Str::random(24);
        $expectedHash = hash('sha256', $rotatedToken);

        $response = postTokenRefreshThrottleTestRequest(
            $this,
            $rotatedToken
        );

        $response
            ->assertOk()
            ->assertJsonPath('token_hash', $expectedHash);
    }

    $nextToken = 'rotated-refresh-token-61-'.Str::random(24);

    $response = postTokenRefreshThrottleTestRequest(
        $this,
        $nextToken
    );

    $response
        ->assertStatus(429)
        ->assertJsonPath('code', 'RATE_LIMITED');
});

it('rate-limits requests that do not provide a refresh token', function (): void {
    $emptyTokenHash = hash('sha256', '');

    for ($attempt = 1; $attempt <= 30; $attempt++) {
        $response = postTokenRefreshThrottleTestRequest($this);

        $response
            ->assertOk()
            ->assertJsonPath('token_hash', $emptyTokenHash);
    }

    $response = postTokenRefreshThrottleTestRequest($this);

    $response
        ->assertStatus(429)
        ->assertJsonPath('code', 'RATE_LIMITED');
});