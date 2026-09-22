<?php

use App\Models\RefreshToken;
use App\Models\User;
use App\Services\Auth\RefreshTokenService;
use App\Services\OtpService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\PersonalAccessToken;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function callSend(
    object $testCase,
    array  $data,
    bool   $bypassThrottle = true
): TestResponse {
    $req = $bypassThrottle
        ? $testCase->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class)
        : $testCase;

    return $req->postJson('/api/v1/auth/customer/send-otp', $data);
}

function callVerify(
    object $testCase,
    array  $data,
    bool   $bypassThrottle = true
): TestResponse {
    $req = $bypassThrottle
        ? $testCase->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class)
        : $testCase;

    return $req->postJson('/api/v1/auth/customer/verify-otp', $data);
}

function callLogout(
    object  $testCase,
    string  $accessToken,
    ?string $refreshToken = null
): TestResponse {
    $cookies = $refreshToken !== null
        ? ['refresh_token' => $refreshToken]
        : [];

    return $testCase->call(
        'POST',
        '/api/v1/auth/customer/logout',
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

function callLogoutAll(object $testCase, string $accessToken): TestResponse
{
    return $testCase->call(
        'POST',
        '/api/v1/auth/customer/logout-all',
        [],
        [],
        [],
        [
            'HTTP_ACCEPT'        => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer '.$accessToken,
            'CONTENT_TYPE'       => 'application/json',
        ],
        json_encode([], JSON_THROW_ON_ERROR)
    );
}

function tokenAbilities(string $plainTextToken): array
{
    $id = (int) (explode('|', $plainTextToken)[0] ?? 0);

    return PersonalAccessToken::find($id)?->abilities ?? [];
}

function mockOtpSend(object $testCase, array $result): void
{
    $mock = \Mockery::mock(OtpService::class);
    $mock->shouldReceive('send')->andReturn($result);
    $mock->shouldReceive('verify')->byDefault()
        ->andReturn(['status' => false, 'message' => 'کد یافت نشد.']);
    app()->instance(OtpService::class, $mock);
}

function mockOtpVerify(object $testCase, array $result): void
{
    $mock = \Mockery::mock(OtpService::class);
    $mock->shouldReceive('send')->byDefault()
        ->andReturn(['status' => true, 'message' => '...', 'expires_in' => 120]);
    $mock->shouldReceive('verify')->andReturn($result);
    app()->instance(OtpService::class, $mock);
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(function (): void {
    Cache::flush();

    // Default: OtpService succeeds — override per test as needed.
    $this->mock(OtpService::class, function ($mock) {
        $mock->shouldReceive('send')
            ->andReturn(['status' => true, 'message' => 'کد ارسال شد.', 'expires_in' => 120]);
        $mock->shouldReceive('verify')
            ->andReturn(['status' => true]);
    });
});

// ---------------------------------------------------------------------------
// send() — validation (OtpService is never reached)
// ---------------------------------------------------------------------------

it('returns 422 when channel is missing', function (): void {
    callSend($this, ['phone' => '09121234567'])->assertStatus(422);
});

it('returns 422 for an unsupported channel value', function (): void {
    callSend($this, ['channel' => 'telegram', 'phone' => '09121234567'])->assertStatus(422);
});

it('returns 422 when phone is not provided for phone channel', function (): void {
    callSend($this, ['channel' => 'phone'])->assertStatus(422);
});

it('returns 422 for a phone that does not start with 09', function (): void {
    callSend($this, ['channel' => 'phone', 'phone' => '01121234567'])->assertStatus(422);
});

it('returns 422 for a phone shorter than 11 digits', function (): void {
    callSend($this, ['channel' => 'phone', 'phone' => '0912123456'])->assertStatus(422);
});

it('returns 422 when email is not provided for email channel', function (): void {
    callSend($this, ['channel' => 'email'])->assertStatus(422);
});

it('returns 422 for a malformed email address', function (): void {
    callSend($this, ['channel' => 'email', 'email' => 'not-an-email'])->assertStatus(422);
});

// ---------------------------------------------------------------------------
// send() — OtpService result mapping
// ---------------------------------------------------------------------------

it('returns 200 and calls OtpService with correct channel for phone', function (): void {
    $this->mock(OtpService::class, function ($mock) {
        $mock->shouldReceive('send')
            ->once()
            ->with('09121234567', \Mockery::type(\App\Enums\OtpChannel::class))
            ->andReturn(['status' => true, 'message' => 'کد ارسال شد.', 'expires_in' => 120]);
    });

    callSend($this, ['channel' => 'phone', 'phone' => '09121234567'])->assertOk();
});

it('returns 200 and calls OtpService with correct channel for email', function (): void {
    $this->mock(OtpService::class, function ($mock) {
        $mock->shouldReceive('send')
            ->once()
            ->with('user@example.com', \Mockery::type(\App\Enums\OtpChannel::class))
            ->andReturn(['status' => true, 'message' => 'کد ارسال شد.', 'expires_in' => 120]);
    });

    callSend($this, ['channel' => 'email', 'email' => 'user@example.com'])->assertOk();
});

it('returns 429 when OtpService reports cooldown', function (): void {
    mockOtpSend($this, ['status' => false, 'message' => '60 ثانیه صبر کنید.', 'code' => 429]);

    callSend($this, ['channel' => 'phone', 'phone' => '09121234567'])->assertStatus(429);
});

it('returns 429 when OtpService reports hourly limit exceeded', function (): void {
    mockOtpSend($this, ['status' => false, 'message' => 'سقف ارسال در این ساعت.', 'code' => 429]);

    callSend($this, ['channel' => 'phone', 'phone' => '09121234567'])->assertStatus(429);
});

// ---------------------------------------------------------------------------
// verify() — validation
// ---------------------------------------------------------------------------

it('returns 422 when the OTP code is missing', function (): void {
    callVerify($this, ['channel' => 'phone', 'phone' => '09121234567'])->assertStatus(422);
});

it('returns 422 when the OTP code is not exactly 6 digits', function (): void {
    callVerify($this, ['channel' => 'phone', 'phone' => '09121234567', 'code' => '12345'])
        ->assertStatus(422);
});

// ---------------------------------------------------------------------------
// verify() — OtpService failures
// ---------------------------------------------------------------------------

it('returns 422 when OtpService rejects the code', function (): void {
    mockOtpVerify($this, ['status' => false, 'message' => 'کد اشتباه است.']);

    callVerify($this, ['channel' => 'phone', 'phone' => '09121234567', 'code' => '000000'])
        ->assertStatus(422);
});

it('returns 422 when OTP has expired', function (): void {
    mockOtpVerify($this, ['status' => false, 'message' => 'کد منقضی شده است.']);

    callVerify($this, ['channel' => 'phone', 'phone' => '09121234567', 'code' => '123456'])
        ->assertStatus(422);
});

// ---------------------------------------------------------------------------
// verify() — new user creation
// ---------------------------------------------------------------------------

it('creates a new customer on first successful OTP verification', function (): void {
    $phone = '09121000001';

    callVerify($this, ['channel' => 'phone', 'phone' => $phone, 'code' => '123456'])
        ->assertOk();

    $user = User::where('phone', $phone)->first();

    expect($user)->not->toBeNull()
        ->and($user->user_type)->toBe('customer')
        ->and($user->is_active)->toBeTrue();
});

it('new user is created with direct property assignment not mass assignment', function (): void {
    // user_type and is_active are NOT in $fillable.
    // The controller sets them via direct assignment — this test verifies
    // they are set correctly despite not being mass-assignable.
    $phone = '09121000002';

    callVerify($this, ['channel' => 'phone', 'phone' => $phone, 'code' => '123456'])
        ->assertOk();

    $user = User::where('phone', $phone)->first();

    expect($user->user_type)->toBe('customer')
        ->and($user->is_active)->toBeTrue();
});

it('sets phone_verified_at when the phone is first verified', function (): void {
    $phone = '09121000003';

    callVerify($this, ['channel' => 'phone', 'phone' => $phone, 'code' => '123456'])
        ->assertOk();

    expect(User::where('phone', $phone)->first()?->phone_verified_at)->not->toBeNull();
});

it('sets last_login_at on every successful verification', function (): void {
    $phone = '09121000004';

    callVerify($this, ['channel' => 'phone', 'phone' => $phone, 'code' => '123456'])
        ->assertOk();

    expect(User::where('phone', $phone)->first()?->last_login_at)->not->toBeNull();
});

it('returns an access token scoped to customer:api on successful verification', function (): void {
    $response = callVerify($this, [
        'channel' => 'phone',
        'phone'   => '09121000005',
        'code'    => '123456',
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'data' => ['access_token', 'token_type', 'expires_in', 'user'],
        ]);

    expect(tokenAbilities($response->json('data.access_token')))
        ->toBe(['customer:api']);
});

it('returns an HttpOnly refresh cookie on successful verification', function (): void {
    $response = callVerify($this, [
        'channel' => 'phone',
        'phone'   => '09121000006',
        'code'    => '123456',
    ]);

    $response->assertOk();

    $cookie = collect($response->headers->getCookies())
        ->first(fn ($c) => $c->getName() === 'refresh_token');

    expect($cookie)->not->toBeNull()
        ->and($cookie->isHttpOnly())->toBeTrue();
});

// ---------------------------------------------------------------------------
// verify() — existing user
// ---------------------------------------------------------------------------

it('authenticates an existing customer without creating a duplicate', function (): void {
    $user = User::factory()->customer()->create(['phone' => '09121000007']);

    $response = callVerify($this, [
        'channel' => 'phone',
        'phone'   => '09121000007',
        'code'    => '123456',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.user.id', $user->id);

    expect(User::where('phone', '09121000007')->count())->toBe(1);
});

// ---------------------------------------------------------------------------
// verify() — security
// ---------------------------------------------------------------------------

it('blocks a staff account from logging in via customer OTP endpoint', function (): void {
    // SECURITY: Privilege escalation.
    // OtpService says the code is valid, but the controller must still
    // return 403 because the found user is staff, not customer.
    User::factory()->staff()->create(['phone' => '09121001001']);

    $response = callVerify($this, [
        'channel' => 'phone',
        'phone'   => '09121001001',
        'code'    => '123456',
    ]);

    $response->assertStatus(403);

    // No token must be issued to the staff account.
    $count = PersonalAccessToken::whereHas(
        'tokenable',
        fn ($q) => $q->where('phone', '09121001001')
    )->count();

    expect($count)->toBe(0);
});

it('blocks an inactive customer even when OTP is valid', function (): void {
    $user = User::factory()->customer()->create(['phone' => '09121001002']);
    $user->deactivate();

    $response = callVerify($this, [
        'channel' => 'phone',
        'phone'   => '09121001002',
        'code'    => '123456',
    ]);

    $response->assertStatus(403);
});

it('does not issue a token to an inactive customer', function (): void {
    $user = User::factory()->customer()->create(['phone' => '09121001003']);
    $user->deactivate();

    $response = callVerify($this, [
        'channel' => 'phone',
        'phone'   => '09121001003',
        'code'    => '123456',
    ]);

    $response->assertStatus(403);

    expect($response->json('data.access_token'))->toBeNull();
});

// ---------------------------------------------------------------------------
// logout()
// ---------------------------------------------------------------------------

it('revokes only the current device access token on logout', function (): void {
    $user   = User::factory()->customer()->create();
    $token1 = $user->createToken('device_1', ['customer:api'])->plainTextToken;
    $token2 = $user->createToken('device_2', ['customer:api'])->plainTextToken;

    callLogout($this, $token1)->assertOk();

    $id1 = (int) (explode('|', $token1)[0] ?? 0);
    $id2 = (int) (explode('|', $token2)[0] ?? 0);

    expect(PersonalAccessToken::find($id1))->toBeNull()
        ->and(PersonalAccessToken::find($id2))->not->toBeNull();
});

it('revokes the refresh token for the current device on logout', function (): void {
    $user   = User::factory()->customer()->create();
    $token  = $user->createToken('device_1', ['customer:api'])->plainTextToken;
    $issued = app(RefreshTokenService::class)->issueNew($user, request());

    callLogout($this, $token, $issued->plainToken)->assertOk();

    $record = RefreshToken::where(
        'token_hash',
        hash('sha256', $issued->plainToken)
    )->first();

    expect($record?->revoked_at)->not->toBeNull();
});

it('returns 401 when logout is called without a valid access token', function (): void {
    callLogout($this, 'invalid-bearer-token')->assertStatus(401);
});

// ---------------------------------------------------------------------------
// logoutAll()
// ---------------------------------------------------------------------------

it('revokes all access tokens for the user on logoutAll', function (): void {
    $user   = User::factory()->customer()->create();
    $token1 = $user->createToken('device_1', ['customer:api'])->plainTextToken;
    $user->createToken('device_2', ['customer:api']);
    $user->createToken('device_3', ['customer:api']);

    callLogoutAll($this, $token1)->assertOk();

    expect(PersonalAccessToken::where('tokenable_id', $user->id)->count())->toBe(0);
});

it('returns 401 when logoutAll is called without a valid access token', function (): void {
    callLogoutAll($this, 'invalid-bearer-token')->assertStatus(401);
});