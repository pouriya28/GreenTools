<?php

use App\Models\User;
use App\Services\Auth\RefreshTokenService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\PersonalAccessToken;
use PragmaRX\Google2FA\Google2FA;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function callAdminLogin(
    object $testCase,
    array  $data,
    bool   $bypassThrottle = true
): TestResponse {
    $req = $bypassThrottle
        ? $testCase->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class)
        : $testCase;

    return $req->postJson('/api/v1/auth/staff/login', $data);
}

function callVerify2fa(
    object $testCase,
    string $accessToken,
    string $code,
    bool   $bypassThrottle = true
): TestResponse {
    $req = $bypassThrottle
        ? $testCase->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class)
        : $testCase;

    return $req->withHeaders([
        'Authorization' => 'Bearer '.$accessToken,
        'Accept'        => 'application/json',
    ])->postJson('/api/v1/auth/staff/verify-2fa', ['totp_code' => $code]);
}

function callStaff(
    object $testCase,
    string $method,
    string $path,
    string $accessToken,
    array  $data = []
): TestResponse {
    return $testCase->withHeaders([
        'Authorization' => 'Bearer '.$accessToken,
        'Accept'        => 'application/json',
    ])->json($method, '/api/v1/auth/staff/'.$path, $data);
}

function callAdminLogout(
    object  $testCase,
    string  $accessToken,
    ?string $refreshToken = null
): TestResponse {
    $cookies = $refreshToken !== null ? ['refresh_token' => $refreshToken] : [];

    return $testCase->call(
        'POST',
        '/api/v1/auth/staff/logout',
        [],
        $cookies,
        [],
        [
            'HTTP_ACCEPT'        => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer '.$accessToken,
            'CONTENT_TYPE'       => 'application/json',
        ],
        json_encode([], JSON_THROW_ON_ERROR)
    );
}

function makeStaff(array $attrs = []): User
{
    return User::factory()->staff()->create($attrs);
}

function currentOtp(string $secret): string
{
    return (new Google2FA())->getCurrentOtp($secret);
}

function tokenAbilitiesAdmin(string $plainTextToken): array
{
    $id = (int) (explode('|', $plainTextToken)[0] ?? 0);

    return PersonalAccessToken::find($id)?->abilities ?? [];
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(function (): void {
    Cache::flush();
    Mail::fake();
});

// ---------------------------------------------------------------------------
// login() — validation
// ---------------------------------------------------------------------------

it('returns 422 when login field is missing', function (): void {
    callAdminLogin($this, ['password' => 'password123'])->assertStatus(422);
});

it('returns 422 when password is shorter than 8 characters', function (): void {
    callAdminLogin($this, ['login' => 'admin', 'password' => '1234567'])->assertStatus(422);
});

// ---------------------------------------------------------------------------
// login() — authentication failures
// ---------------------------------------------------------------------------

it('returns 401 for a non-existent user', function (): void {
    callAdminLogin($this, ['login' => 'nobody@example.com', 'password' => 'password123'])
        ->assertStatus(401);
});

it('returns 401 for a wrong password', function (): void {
    makeStaff(['username' => 'staffuser']);

    callAdminLogin($this, ['login' => 'staffuser', 'password' => 'wrongpassword'])
        ->assertStatus(401);
});

it('returns the same 401 message for wrong password and non-existent user (anti-enumeration)', function (): void {
    makeStaff(['username' => 'realstaff']);

    $existingResponse    = callAdminLogin($this, ['login' => 'realstaff', 'password' => 'wrong']);
    $nonExistentResponse = callAdminLogin($this, ['login' => 'nobody@nowhere.test', 'password' => 'wrong']);

    expect($existingResponse->json('message'))->toBe($nonExistentResponse->json('message'))
        ->and($existingResponse->status())->toBe($nonExistentResponse->status());
});

it('rejects a customer account logging in via the staff endpoint', function (): void {
    User::factory()->customer()->create(['email' => 'customer@shop.com']);

    callAdminLogin($this, ['login' => 'customer@shop.com', 'password' => 'password'])
        ->assertStatus(401);
});

// ---------------------------------------------------------------------------
// login() — happy path without 2FA
// ---------------------------------------------------------------------------

it('returns 200 with a wildcard access token for valid staff credentials', function (): void {
    makeStaff(['username' => 'validstaff']);

    $response = callAdminLogin($this, ['login' => 'validstaff', 'password' => 'password']);

    $response->assertOk()
        ->assertJsonStructure([
            'data' => ['access_token', 'token_type', 'expires_in', 'user'],
        ]);

    expect(tokenAbilitiesAdmin($response->json('data.access_token')))->toBe(['*']);
});

it('can login using email instead of username', function (): void {
    makeStaff(['email' => 'staff@company.com']);

    callAdminLogin($this, ['login' => 'staff@company.com', 'password' => 'password'])
        ->assertOk();
});

it('issues an HttpOnly refresh cookie on successful login', function (): void {
    makeStaff(['username' => 'cookiestaff']);

    $response = callAdminLogin($this, ['login' => 'cookiestaff', 'password' => 'password']);

    $response->assertOk();

    $cookie = collect($response->headers->getCookies())
        ->first(fn ($c) => $c->getName() === 'refresh_token');

    expect($cookie)->not->toBeNull()
        ->and($cookie->isHttpOnly())->toBeTrue();
});

it('clears failed_login_attempts on successful login', function (): void {
    $user = makeStaff(['username' => 'clearstaff']);
    $user->failed_login_attempts = 3;
    $user->save();

    callAdminLogin($this, ['login' => 'clearstaff', 'password' => 'password'])->assertOk();

    expect($user->fresh()->failed_login_attempts)->toBe(0);
});

it('sets last_login_at on successful login', function (): void {
    makeStaff(['username' => 'logintime']);

    callAdminLogin($this, ['login' => 'logintime', 'password' => 'password'])->assertOk();

    expect(User::where('username', 'logintime')->first()?->last_login_at)->not->toBeNull();
});

// ---------------------------------------------------------------------------
// login() — inactive account
// ---------------------------------------------------------------------------

it('returns 403 for an inactive staff account', function (): void {
    $user = makeStaff(['username' => 'inactivestaff']);
    $user->deactivate();

    callAdminLogin($this, ['login' => 'inactivestaff', 'password' => 'password'])
        ->assertStatus(403);
});

// ---------------------------------------------------------------------------
// login() — lockout
// ---------------------------------------------------------------------------

it('increments failed_login_attempts on each wrong password', function (): void {
    $user = makeStaff(['username' => 'failstaff']);

    callAdminLogin($this, ['login' => 'failstaff', 'password' => 'wrongpass']);
    callAdminLogin($this, ['login' => 'failstaff', 'password' => 'wrongpass']);

    expect($user->fresh()->failed_login_attempts)->toBe(2);
});

it('locks the account after 5 failed login attempts', function (): void {
    $user = makeStaff(['username' => 'lockmestaff']);

    for ($i = 0; $i < 5; $i++) {
        callAdminLogin($this, ['login' => 'lockmestaff', 'password' => 'wrongpass']);
    }

    expect($user->fresh()->locked_until)->not->toBeNull()
        ->and($user->fresh()->locked_until->isFuture())->toBeTrue();
});

it('returns 423 when correct password is used on a locked account', function (): void {
    // The lockout state is intentionally revealed only after the correct
    // password is proven — otherwise a distinct 423 would leak whether a
    // given username is registered and currently locked.
    $user = makeStaff(['username' => 'lockedstaff']);
    $user->locked_until = now()->addMinutes(10);
    $user->save();

    callAdminLogin($this, ['login' => 'lockedstaff', 'password' => 'password'])
        ->assertStatus(423);
});

it('returns 401 (not 423) when wrong password is used on a locked account', function (): void {
    $user = makeStaff(['username' => 'lockedwrongstaff']);
    $user->locked_until = now()->addMinutes(10);
    $user->save();

    callAdminLogin($this, ['login' => 'lockedwrongstaff', 'password' => 'wrongpassword'])
        ->assertStatus(401);
});

it('allows login again after lockout period expires', function (): void {
    $user = makeStaff(['username' => 'expiredlock']);
    $user->locked_until = now()->subMinute();
    $user->save();

    callAdminLogin($this, ['login' => 'expiredlock', 'password' => 'password'])
        ->assertOk();
});

// ---------------------------------------------------------------------------
// login() — 2FA step one
// ---------------------------------------------------------------------------

it('returns 206 with a 2fa:pending token when 2FA is required', function (): void {
    $secret = (new Google2FA())->generateSecretKey();
    $user   = makeStaff(['username' => 'twofastaff']);
    $user->two_factor_enabled = true;
    $user->two_factor_secret  = $secret;
    $user->save();

    $response = callAdminLogin($this, ['login' => 'twofastaff', 'password' => 'password']);

    $response->assertStatus(206)
        ->assertJsonPath('requires_2fa', true)
        ->assertJsonStructure(['access_token', 'message']);

    expect(tokenAbilitiesAdmin($response->json('access_token')))->toBe(['2fa:pending']);
});

it('2fa:pending token expires in 5 minutes', function (): void {
    $secret = (new Google2FA())->generateSecretKey();
    $user   = makeStaff(['username' => 'twofaexpiry']);
    $user->two_factor_enabled = true;
    $user->two_factor_secret  = $secret;
    $user->save();

    $response = callAdminLogin($this, ['login' => 'twofaexpiry', 'password' => 'password']);

    $tokenId = (int) (explode('|', $response->json('access_token'))[0] ?? 0);
    $record  = PersonalAccessToken::find($tokenId);

    expect($record->expires_at)->not->toBeNull()
        ->and($record->expires_at->diffInMinutes(now(), true))->toBeLessThanOrEqual(5);
});

// ---------------------------------------------------------------------------
// verify2fa()
// ---------------------------------------------------------------------------

it('issues a wildcard token after a valid 2FA code', function (): void {
    $google2fa = new Google2FA();
    $secret    = $google2fa->generateSecretKey();
    $user      = makeStaff(['username' => 'verify2fastaff']);
    $user->two_factor_enabled = true;
    $user->two_factor_secret  = $secret;
    $user->save();

    $tempToken = callAdminLogin($this, ['login' => 'verify2fastaff', 'password' => 'password'])
        ->json('access_token');

    $response = callVerify2fa($this, $tempToken, $google2fa->getCurrentOtp($secret));

    $response->assertOk();
    expect(tokenAbilitiesAdmin($response->json('data.access_token')))->toBe(['*']);
});

it('deletes the temporary 2fa:pending token after successful verification', function (): void {
    $google2fa = new Google2FA();
    $secret    = $google2fa->generateSecretKey();
    $user      = makeStaff(['username' => 'verify2fadel']);
    $user->two_factor_enabled = true;
    $user->two_factor_secret  = $secret;
    $user->save();

    $tempToken = callAdminLogin($this, ['login' => 'verify2fadel', 'password' => 'password'])
        ->json('access_token');

    $tempId = (int) (explode('|', $tempToken)[0] ?? 0);

    callVerify2fa($this, $tempToken, $google2fa->getCurrentOtp($secret))->assertOk();

    expect(PersonalAccessToken::find($tempId))->toBeNull();
});

it('returns 422 for an invalid 2FA code', function (): void {
    $user = makeStaff(['username' => 'bad2fastaff']);
    $user->two_factor_enabled = true;
    $user->two_factor_secret  = (new Google2FA())->generateSecretKey();
    $user->save();

    $tempToken = callAdminLogin($this, ['login' => 'bad2fastaff', 'password' => 'password'])
        ->json('access_token');

    callVerify2fa($this, $tempToken, '000000')->assertStatus(422);
});

it('cannot reach verify-2fa with a full wildcard token', function (): void {
    $user  = makeStaff(['username' => 'wrongabilstaff']);
    $token = $user->createToken('staff_auth', ['*'])->plainTextToken;

    callVerify2fa($this, $token, '123456')->assertStatus(403);
});

// ---------------------------------------------------------------------------
// setup-2fa / enable-2fa / disable-2fa
// ---------------------------------------------------------------------------

it('setup-2fa returns a new secret and QR code URL', function (): void {
    $user  = makeStaff(['username' => 'setup2fastaff']);
    $token = $user->createToken('staff_auth', ['*'])->plainTextToken;

    callStaff($this, 'POST', 'setup-2fa', $token)
        ->assertOk()
        ->assertJsonStructure(['secret', 'qr_code_url', 'message']);
});

it('setup-2fa saves the secret to the user', function (): void {
    $user  = makeStaff(['username' => 'setup2fasave']);
    $token = $user->createToken('staff_auth', ['*'])->plainTextToken;

    callStaff($this, 'POST', 'setup-2fa', $token)->assertOk();

    expect($user->fresh()->two_factor_secret)->not->toBeNull();
});

it('enable-2fa activates two-factor authentication with a valid code', function (): void {
    $google2fa = new Google2FA();
    $secret    = $google2fa->generateSecretKey();
    $user      = makeStaff(['username' => 'enable2fastaff']);
    $user->two_factor_secret = $secret;
    $user->save();
    $token = $user->createToken('staff_auth', ['*'])->plainTextToken;

    callStaff($this, 'POST', 'enable-2fa', $token, ['totp_code' => $google2fa->getCurrentOtp($secret)])
        ->assertOk();

    expect($user->fresh()->two_factor_enabled)->toBeTrue();
});

it('enable-2fa returns 422 for an invalid TOTP code', function (): void {
    $user = makeStaff(['username' => 'badenablestaff']);
    $user->two_factor_secret = (new Google2FA())->generateSecretKey();
    $user->save();
    $token = $user->createToken('staff_auth', ['*'])->plainTextToken;

    callStaff($this, 'POST', 'enable-2fa', $token, ['totp_code' => '000000'])
        ->assertStatus(422);
});

it('enable-2fa returns 400 when no secret has been generated yet', function (): void {
    $user  = makeStaff(['username' => 'nosecretstaff']);
    $token = $user->createToken('staff_auth', ['*'])->plainTextToken;

    callStaff($this, 'POST', 'enable-2fa', $token, ['totp_code' => '123456'])
        ->assertStatus(400);
});

it('disable-2fa clears two-factor authentication with a valid code', function (): void {
    $google2fa = new Google2FA();
    $secret    = $google2fa->generateSecretKey();
    $user      = makeStaff(['username' => 'disable2fastaff']);
    $user->two_factor_enabled = true;
    $user->two_factor_secret  = $secret;
    $user->save();
    $token = $user->createToken('staff_auth', ['*'])->plainTextToken;

    callStaff($this, 'POST', 'disable-2fa', $token, ['totp_code' => $google2fa->getCurrentOtp($secret)])
        ->assertOk();

    $fresh = $user->fresh();
    expect($fresh->two_factor_enabled)->toBeFalse()
        ->and($fresh->two_factor_secret)->toBeNull();
});

it('disable-2fa returns 422 for an invalid TOTP code', function (): void {
    $user = makeStaff(['username' => 'baddisablestaff']);
    $user->two_factor_enabled = true;
    $user->two_factor_secret  = (new Google2FA())->generateSecretKey();
    $user->save();
    $token = $user->createToken('staff_auth', ['*'])->plainTextToken;

    callStaff($this, 'POST', 'disable-2fa', $token, ['totp_code' => '000000'])
        ->assertStatus(422);
});

// ---------------------------------------------------------------------------
// logout()
// ---------------------------------------------------------------------------

it('revokes only the current device token on logout', function (): void {
    $user   = makeStaff(['username' => 'logoutstaff']);
    $token1 = $user->createToken('device_1', ['*'])->plainTextToken;
    $token2 = $user->createToken('device_2', ['*'])->plainTextToken;

    callAdminLogout($this, $token1)->assertOk();

    $id1 = (int) (explode('|', $token1)[0] ?? 0);
    $id2 = (int) (explode('|', $token2)[0] ?? 0);

    expect(PersonalAccessToken::find($id1))->toBeNull()
        ->and(PersonalAccessToken::find($id2))->not->toBeNull();
});

it('revokes the refresh token on logout', function (): void {
    $user   = makeStaff(['username' => 'refreshlogout']);
    $token  = $user->createToken('device_1', ['*'])->plainTextToken;
    $issued = app(RefreshTokenService::class)->issueNew($user, request());

    callAdminLogout($this, $token, $issued->plainToken)->assertOk();

    $record = \App\Models\RefreshToken::where(
        'token_hash',
        hash('sha256', $issued->plainToken)
    )->first();

    expect($record?->revoked_at)->not->toBeNull();
});

it('returns 401 when logout is called without a valid token', function (): void {
    callAdminLogout($this, 'invalid-token')->assertStatus(401);
});

// ---------------------------------------------------------------------------
// logoutAll()
// ---------------------------------------------------------------------------

it('revokes all tokens on logoutAll', function (): void {
    $user   = makeStaff(['username' => 'logoutallstaff']);
    $token1 = $user->createToken('device_1', ['*'])->plainTextToken;
    $user->createToken('device_2', ['*']);
    $user->createToken('device_3', ['*']);

    callStaff($this, 'POST', 'logout-all', $token1)->assertOk();

    expect(PersonalAccessToken::where('tokenable_id', $user->id)->count())->toBe(0);
});

