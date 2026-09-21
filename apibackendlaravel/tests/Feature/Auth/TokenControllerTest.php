<?php

use App\Models\RefreshToken;
use App\Models\User;
use App\Services\Auth\RefreshTokenService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\PersonalAccessToken;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function issueCustomerToken(): array
{
    $user   = User::factory()->customer()->create();
    $issued = app(RefreshTokenService::class)->issueNew($user, request());

    return [$user, $issued];
}

function issueStaffToken(): array
{
    $user   = User::factory()->staff()->create();
    $issued = app(RefreshTokenService::class)->issueNew($user, request());

    return [$user, $issued];
}

/**
 * Sends a real POST to /api/v1/auth/refresh.
 *
 * IMPORTANT: The API middleware group does NOT include EncryptCookies.
 * The refresh_token cookie is stored and transmitted as plain text.
 * Do NOT encrypt the value here — the controller reads it raw and hashes
 * it immediately; encrypting would break the hash lookup in the DB.
 *
 * This is safe because:
 *  - The token is 64 cryptographically random hex characters.
 *  - The cookie is HttpOnly (no JS access).
 *  - In production the cookie is Secure (HTTPS only).
 *  - The DB stores only SHA-256(token), not the token itself.
 */
function callRefresh(
    object  $testCase,
    ?string $plainToken,
    string  $origin = 'http://localhost:5173'
): TestResponse {
    $cookies = $plainToken !== null
        ? ['refresh_token' => $plainToken]
        : [];

    return $testCase->call(
        'POST',
        '/api/v1/auth/refresh',
        [],
        $cookies,
        [],
        array_filter([
            'HTTP_ACCEPT'  => 'application/json',
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ORIGIN'  => $origin ?: null,
        ]),
        json_encode([], JSON_THROW_ON_ERROR)
    );
}

function parseSanctumTokenAbilities(string $plainTextToken): array
{
    $id     = explode('|', $plainTextToken)[0] ?? null;
    $record = PersonalAccessToken::find((int) $id);

    return $record?->abilities ?? [];
}

function getRefreshCookieFromResponse(TestResponse $response): ?\Symfony\Component\HttpFoundation\Cookie
{
    return collect($response->headers->getCookies())
        ->first(fn ($cookie) => $cookie->getName() === 'refresh_token');
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(function (): void {
    Cache::flush();

    config([
        'cors.frontend_origins'        => ['http://localhost:5173'],
        'refresh_tokens.grace_seconds' => 10,
        'refresh_tokens.ttl_days'      => 7,
    ]);
});

// ---------------------------------------------------------------------------
// Happy path: Customer
// ---------------------------------------------------------------------------

it('returns a new access token and rotated cookie for an active customer', function (): void {
    [$user, $issued] = issueCustomerToken();

    $response = callRefresh($this, $issued->plainToken);

    $response
        ->assertOk()
        ->assertJsonStructure([
            'status',
            'message',
            'data' => [
                'access_token',
                'token_type',
                'expires_in',
                'user' => ['id', 'name', 'type', 'phone', 'email', 'loyalty'],
            ],
        ])
        ->assertJsonPath('status', 'success')
        ->assertJsonPath('data.token_type', 'Bearer')
        ->assertJsonPath('data.expires_in', 15 * 60)
        ->assertJsonPath('data.user.id', $user->id)
        ->assertJsonPath('data.user.type', 'customer');
});

it('customer receives access token scoped to customer:api only', function (): void {
    [$user, $issued] = issueCustomerToken();

    $response = callRefresh($this, $issued->plainToken);

    $response->assertOk();

    $abilities = parseSanctumTokenAbilities(
        $response->json('data.access_token')
    );

    expect($abilities)->toBe(['customer:api']);
});

it('staff receives access token scoped to wildcard abilities', function (): void {
    [$user, $issued] = issueStaffToken();

    $response = callRefresh($this, $issued->plainToken);

    $response->assertOk();

    $abilities = parseSanctumTokenAbilities(
        $response->json('data.access_token')
    );

    expect($abilities)->toBe(['*']);
});

// ---------------------------------------------------------------------------
// Cookie security
// ---------------------------------------------------------------------------

it('sets a new HttpOnly refresh cookie after successful rotation', function (): void {
    [$user, $issued] = issueCustomerToken();

    $response = callRefresh($this, $issued->plainToken);

    $response->assertOk();

    $cookie = getRefreshCookieFromResponse($response);

    expect($cookie)->not->toBeNull()
        ->and($cookie->isHttpOnly())->toBeTrue()
        ->and($cookie->getValue())->not->toBe($issued->plainToken);
});

it('new refresh cookie is scoped to /api/v1/auth path not the full refresh route', function (): void {
    // If the path were /api/v1/auth/refresh, the browser would only send
    // the cookie on that single endpoint. Scoping to /api/v1/auth allows
    // logout and other auth sub-routes to access it, while keeping it
    // out of /api/v1/products and all other API routes.
    [$user, $issued] = issueCustomerToken();

    $response = callRefresh($this, $issued->plainToken);

    $response->assertOk();

    $cookie = getRefreshCookieFromResponse($response);

    expect($cookie)->not->toBeNull()
        ->and($cookie->getPath())->toBe('/api/v1/auth');
});

it('response also clears the legacy refresh cookie path to prevent collision', function (): void {
    // ManagesAuthTokens sends Cookie::forget() for the old /api/v1/auth/refresh
    // path to self-heal browsers that still carry the stale cookie.
    [$user, $issued] = issueCustomerToken();

    $response = callRefresh($this, $issued->plainToken);

    $response->assertOk();

    $legacyCookie = collect($response->headers->getCookies())
        ->first(fn ($c) => $c->getName() === 'refresh_token'
            && $c->getPath() === '/api/v1/auth/refresh'
        );

    expect($legacyCookie)->not->toBeNull()
        ->and($legacyCookie->isCleared())->toBeTrue();
});

it('does not expose the raw refresh token in the response body', function (): void {
    [$user, $issued] = issueCustomerToken();

    $response = callRefresh($this, $issued->plainToken);

    // assertOk prevents this from being a false-positive when the request
    // fails and the body simply contains an error message without any token.
    $response->assertOk();

    expect($response->getContent())->not->toContain($issued->plainToken);
});

it('does not expose the new refresh token in the response body', function (): void {
    [$user, $issued] = issueCustomerToken();

    $response = callRefresh($this, $issued->plainToken);

    $response->assertOk();

    $newCookie = getRefreshCookieFromResponse($response);
    $newToken  = $newCookie?->getValue();

    expect($newToken)->not->toBeNull();
    expect($response->getContent())->not->toContain($newToken);
});

it('marks the old refresh token as used after rotation', function (): void {
    [$user, $issued] = issueCustomerToken();

    $response = callRefresh($this, $issued->plainToken);

    $response->assertOk();

    $oldRecord = RefreshToken::where(
        'token_hash',
        hash('sha256', $issued->plainToken)
    )->first();

    expect($oldRecord?->used_at)->not->toBeNull();
});

it('the old refresh cookie can no longer be used after rotation', function (): void {
    // grace_seconds = 0 ensures the second request is not silently
    // forwarded to the chain head via the grace-period recovery path.
    config(['refresh_tokens.grace_seconds' => 0]);

    [$user, $issued] = issueCustomerToken();

    callRefresh($this, $issued->plainToken)->assertOk();

    $response = callRefresh($this, $issued->plainToken);

    $response->assertStatus(401);
});

// ---------------------------------------------------------------------------
// Invalid / missing token
// ---------------------------------------------------------------------------

it('returns 401 when no refresh token cookie is present', function (): void {
    $response = callRefresh($this, null);

    $response->assertStatus(401);
});

it('returns 401 for a completely unknown refresh token', function (): void {
    $response = callRefresh($this, bin2hex(random_bytes(32)));

    $response->assertStatus(401);
});

it('returns 401 for a revoked refresh token', function (): void {
    [$user, $issued] = issueCustomerToken();

    app(RefreshTokenService::class)->revokeByRawToken($issued->plainToken);

    $response = callRefresh($this, $issued->plainToken);

    $response->assertStatus(401);
});

// ---------------------------------------------------------------------------
// Expired token
// ---------------------------------------------------------------------------

it('returns 401 and revokes the family for an expired refresh token', function (): void {
    [$user, $issued] = issueCustomerToken();

    RefreshToken::where('token_hash', hash('sha256', $issued->plainToken))
        ->update(['expires_at' => now()->subMinute()]);

    $response = callRefresh($this, $issued->plainToken);

    $response->assertStatus(401);

    $anyActive = RefreshToken::where('family_id', $issued->record->family_id)
        ->whereNull('revoked_at')
        ->exists();

    expect($anyActive)->toBeFalse();
});

// ---------------------------------------------------------------------------
// Refresh token reuse — theft detection
// ---------------------------------------------------------------------------

it('returns 401 and revokes the entire family when a used token is replayed', function (): void {
    // grace_seconds = 0: disables the concurrent-request recovery window
    // so the second call is treated as reuse, not a race-condition retry.
    config(['refresh_tokens.grace_seconds' => 0]);

    [$user, $issued] = issueCustomerToken();
    $familyId = $issued->record->family_id;

    callRefresh($this, $issued->plainToken)->assertOk();

    $response = callRefresh($this, $issued->plainToken);

    $response->assertStatus(401);

    $anyActive = RefreshToken::where('family_id', $familyId)
        ->whereNull('revoked_at')
        ->exists();

    expect($anyActive)->toBeFalse();
});

it('revokes all sanctum access tokens for the user when reuse is detected', function (): void {
    config(['refresh_tokens.grace_seconds' => 0]);

    [$user, $issued] = issueCustomerToken();

    callRefresh($this, $issued->plainToken)->assertOk();
    callRefresh($this, $issued->plainToken);

    $remainingTokens = PersonalAccessToken::where(
        'tokenable_id',
        $user->id
    )->count();

    expect($remainingTokens)->toBe(0);
});

// ---------------------------------------------------------------------------
// Inactive user
// ---------------------------------------------------------------------------

it('returns 401 and revokes the family when the user is inactive', function (): void {
    // BUG FOUND & FIXED: $user->update(['is_active' => false]) silently
    // fails because 'is_active' is not in $fillable. User::deactivate()
    // uses direct property assignment to bypass mass-assignment protection.
    [$user, $issued] = issueCustomerToken();
    $familyId = $issued->record->family_id;

    $user->deactivate();

    $response = callRefresh($this, $issued->plainToken);

    $response->assertStatus(403);

    $anyActive = RefreshToken::where('family_id', $familyId)
        ->whereNull('revoked_at')
        ->exists();

    expect($anyActive)->toBeFalse();
});

it('inactive user does not receive a new access token', function (): void {
    [$user, $issued] = issueCustomerToken();

    $user->deactivate();

    $response = callRefresh($this, $issued->plainToken);

    $response->assertStatus(403);

    expect($response->json('data.access_token'))->toBeNull();
});

// ---------------------------------------------------------------------------
// Origin / CSRF protection — verify.origin middleware
// ---------------------------------------------------------------------------

it('returns 403 when the Origin header is missing', function (): void {
    [$user, $issued] = issueCustomerToken();

    $response = $this->call(
        'POST',
        '/api/v1/auth/refresh',
        [],
        ['refresh_token' => $issued->plainToken],
        [],
        [
            'HTTP_ACCEPT'  => 'application/json',
            'CONTENT_TYPE' => 'application/json',
        ],
        json_encode([], JSON_THROW_ON_ERROR)
    );

    $response
        ->assertStatus(403)
        ->assertJsonPath('code', 'ORIGIN_HEADER_MISSING');
});

it('returns 403 when the Origin is not in the allowed list', function (): void {
    [$user, $issued] = issueCustomerToken();

    $response = callRefresh(
        $this,
        $issued->plainToken,
        'https://attacker.example.com'
    );

    $response
        ->assertStatus(403)
        ->assertJsonPath('code', 'ORIGIN_NOT_ALLOWED');
});

it('returns 503 when the allowed origins config is empty', function (): void {
    config(['cors.frontend_origins' => []]);

    [$user, $issued] = issueCustomerToken();

    $response = callRefresh($this, $issued->plainToken);

    $response
        ->assertStatus(503)
        ->assertJsonPath('code', 'ORIGIN_CONFIGURATION_MISSING');
});

it('rejects an origin that is only a prefix of an allowed origin', function (): void {
    config(['cors.frontend_origins' => ['https://shop.example.com']]);

    [$user, $issued] = issueCustomerToken();

    $response = callRefresh(
        $this,
        $issued->plainToken,
        'https://shop.example.com.evil.test'
    );

    $response
        ->assertStatus(403)
        ->assertJsonPath('code', 'ORIGIN_NOT_ALLOWED');
});

// ---------------------------------------------------------------------------
// Grace period — concurrent request resilience
// ---------------------------------------------------------------------------

it('allows a second request within grace period by resolving the chain head', function (): void {
    // Simulates a race condition: client sends two refresh requests
    // almost simultaneously. The second arrives while the first token
    // was just used (within grace_seconds). The service should find the
    // new chain head (Token B) and rotate that instead of rejecting.
    config(['refresh_tokens.grace_seconds' => 30]);

    [$user, $issued] = issueCustomerToken();

    callRefresh($this, $issued->plainToken)->assertOk();

    // Simulate Token A was used only 5 seconds ago.
    RefreshToken::where('token_hash', hash('sha256', $issued->plainToken))
        ->update(['used_at' => now()->subSeconds(5)]);

    $response = callRefresh($this, $issued->plainToken);

    $response->assertOk();
});

it('blocks the second request when it arrives after the grace period', function (): void {
    // Outside grace, replaying a used token must be treated as theft:
    // the entire family must be revoked and 401 returned.
    config(['refresh_tokens.grace_seconds' => 5]);

    [$user, $issued] = issueCustomerToken();

    callRefresh($this, $issued->plainToken)->assertOk();

    // Token A was used 30 seconds ago — beyond the 5-second grace window.
    RefreshToken::where('token_hash', hash('sha256', $issued->plainToken))
        ->update(['used_at' => now()->subSeconds(30)]);

    $response = callRefresh($this, $issued->plainToken);

    $response->assertStatus(401);

    $anyActive = RefreshToken::where('family_id', $issued->record->family_id)
        ->whereNull('revoked_at')
        ->exists();

    expect($anyActive)->toBeFalse();
});

// ---------------------------------------------------------------------------
// DB constraint audit — user_type
// ---------------------------------------------------------------------------

// The PostgreSQL check constraint `users_user_type_check` rejects
// user_type='admin'. This means:
//
//   1. The 'admin' branch in routeNotificationForBale() is dead code and
//      should be simplified to only check for 'staff'.
//
//   2. There is no privilege-escalation risk via 'admin' token abilities,
//      because an 'admin' user can never be inserted into the DB.
//
// Action required: remove 'admin' from routeNotificationForBale() to keep
// the code consistent with the actual DB constraint.
it('rejects inserting a user with user_type=admin due to db check constraint', function (): void {
    expect(fn () => User::factory()->create(['user_type' => 'admin']))
        ->toThrow(\Illuminate\Database\QueryException::class);
});