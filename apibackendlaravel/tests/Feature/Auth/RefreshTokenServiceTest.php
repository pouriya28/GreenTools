<?php

use App\Exceptions\Auth\RefreshTokenExpiredException;
use App\Exceptions\Auth\RefreshTokenInvalidException;
use App\Exceptions\Auth\RefreshTokenReusedException;
use App\Models\RefreshToken;
use App\Models\User;
use App\Services\Auth\RefreshTokenService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

$makeRequest = static fn (): Request => Request::create(
    '/api/v1/auth/refresh',
    'POST',
    server: [
        'REMOTE_ADDR' => '127.0.0.1',
        'HTTP_USER_AGENT' => 'Pest Refresh Token Test',
    ]
);

$createRefreshToken = static function (
    User $user,
    string $rawToken,
    array $overrides = []
): RefreshToken {
    return RefreshToken::create(array_merge([
        'family_id' => (string) Str::uuid(),
        'user_id' => $user->id,
        'token_hash' => hash('sha256', $rawToken),
        'used_at' => null,
        'revoked_at' => null,
        'expires_at' => now()->addDays(7),
        'ip_address' => '127.0.0.1',
        'user_agent' => 'Pest Refresh Token Test',
    ], $overrides));
};

beforeEach(function (): void {
    Carbon::setTestNow('2026-09-19 12:00:00');

    config()->set([
        'refresh_tokens.grace_seconds' => 10,
        'refresh_tokens.ttl_days' => 7,
    ]);
});

afterEach(function (): void {
    Carbon::setTestNow();
});

it('issues a new refresh-token family without storing the raw token', function () use (
    $makeRequest
): void {
    $user = User::factory()->create();

    $issued = app(RefreshTokenService::class)->issueNew(
        $user,
        $makeRequest()
    );

    expect($issued->plainToken)->toHaveLength(64)
        ->and(Str::isUuid($issued->record->family_id))->toBeTrue()
        ->and($issued->record->user_id)->toBe($user->id)
        ->and($issued->record->token_hash)->toBe(
            hash('sha256', $issued->plainToken)
        )
        ->and($issued->record->token_hash)->not->toBe(
            $issued->plainToken
        )
        ->and($issued->record->ip_address)->toBe('127.0.0.1')
        ->and($issued->record->user_agent)->toBe(
            'Pest Refresh Token Test'
        )
        ->and($issued->expiresAt->equalTo(now()->addDays(7)))
        ->toBeTrue()
        ->and($issued->record->exists)->toBeTrue();
});

it('rotates an unused refresh token normally', function () use (
    $makeRequest,
    $createRefreshToken
): void {
    $user = User::factory()->create();
    $rawToken = 'normal-rotation-token';

    $original = $createRefreshToken($user, $rawToken);

    $issued = app(RefreshTokenService::class)->rotate(
        $rawToken,
        $makeRequest()
    );

    $original->refresh();

    expect($original->used_at)->not->toBeNull()
        ->and($original->replaced_by_id)->toBe($issued->record->id)
        ->and($issued->record->family_id)->toBe($original->family_id)
        ->and($issued->record->user_id)->toBe($user->id)
        ->and($issued->record->used_at)->toBeNull()
        ->and($issued->record->revoked_at)->toBeNull()
        ->and($issued->plainToken)->not->toBe($rawToken)
        ->and($issued->record->token_hash)->toBe(
            hash('sha256', $issued->plainToken)
        );
});

it('rejects an unknown raw refresh token', function () use (
    $makeRequest
): void {
    expect(
        fn () => app(RefreshTokenService::class)->rotate(
            'unknown-refresh-token',
            $makeRequest()
        )
    )->toThrow(RefreshTokenInvalidException::class);
});

it('rejects an already revoked refresh token', function () use (
    $makeRequest,
    $createRefreshToken
): void {
    $user = User::factory()->create();
    $rawToken = 'revoked-refresh-token';

    $token = $createRefreshToken($user, $rawToken, [
        'revoked_at' => now()->subMinute(),
    ]);

    expect(
        fn () => app(RefreshTokenService::class)->rotate(
            $rawToken,
            $makeRequest()
        )
    )->toThrow(RefreshTokenInvalidException::class);

    expect($token->fresh()->revoked_at)->not->toBeNull();
});

it('rotates the chain head for a legitimate reuse inside the grace window', function () use (
    $makeRequest,
    $createRefreshToken
): void {
    $user = User::factory()->create();
    $familyId = (string) Str::uuid();
    $originalRawToken = 'grace-original-token';

    $original = $createRefreshToken(
        $user,
        $originalRawToken,
        [
            'family_id' => $familyId,
            'used_at' => now()->subSeconds(5),
        ]
    );

    $head = $createRefreshToken(
        $user,
        'grace-current-head-token',
        [
            'family_id' => $familyId,
        ]
    );

    $original->update([
        'replaced_by_id' => $head->id,
    ]);

    $issued = app(RefreshTokenService::class)->rotate(
        $originalRawToken,
        $makeRequest()
    );

    $head->refresh();

    expect($head->used_at)->not->toBeNull()
        ->and($head->replaced_by_id)->toBe($issued->record->id)
        ->and($issued->record->family_id)->toBe($familyId)
        ->and(
            RefreshToken::query()
                ->where('family_id', $familyId)
                ->whereNotNull('revoked_at')
                ->count()
        )->toBe(0);
});

it('commits family revocation before throwing an expired-token exception', function () use (
    $makeRequest,
    $createRefreshToken
): void {
    $user = User::factory()->create();
    $user->createToken('expired-access-token');

    $rawToken = 'expired-refresh-token';
    $familyId = (string) Str::uuid();

    $createRefreshToken($user, $rawToken, [
        'family_id' => $familyId,
        'expires_at' => now()->subMinute(),
    ]);

    expect(
        fn () => app(RefreshTokenService::class)->rotate(
            $rawToken,
            $makeRequest()
        )
    )->toThrow(RefreshTokenExpiredException::class);

    expect(
        RefreshToken::query()
            ->where('family_id', $familyId)
            ->whereNull('revoked_at')
            ->count()
    )->toBe(0)
        ->and($user->tokens()->count())->toBe(0);
});

it('commits family and access-token revocation before throwing a reuse exception', function () use (
    $makeRequest,
    $createRefreshToken
): void {
    $user = User::factory()->create();
    $user->createToken('reused-access-token');

    $rawToken = 'reused-refresh-token';
    $familyId = (string) Str::uuid();

    $original = $createRefreshToken(
        $user,
        $rawToken,
        [
            'family_id' => $familyId,
            'used_at' => now()->subSeconds(11),
        ]
    );

    $replacement = $createRefreshToken(
        $user,
        'replacement-refresh-token',
        [
            'family_id' => $familyId,
        ]
    );

    $original->update([
        'replaced_by_id' => $replacement->id,
    ]);

    expect(
        fn () => app(RefreshTokenService::class)->rotate(
            $rawToken,
            $makeRequest()
        )
    )->toThrow(RefreshTokenReusedException::class);

    expect(
        RefreshToken::query()
            ->where('family_id', $familyId)
            ->whereNull('revoked_at')
            ->count()
    )->toBe(0)
        ->and($user->tokens()->count())->toBe(0);
});

it('revokes only the matching family by raw token', function () use (
    $createRefreshToken
): void {
    $user = User::factory()->create();
    $user->createToken('current-access-token');

    $firstRawToken = 'first-family-token';

    $first = $createRefreshToken(
        $user,
        $firstRawToken
    );

    $second = $createRefreshToken(
        $user,
        'second-family-token'
    );

    app(RefreshTokenService::class)->revokeByRawToken(
        $firstRawToken
    );

    expect($first->fresh()->revoked_at)->not->toBeNull()
        ->and($second->fresh()->revoked_at)->toBeNull()
        ->and($user->tokens()->count())->toBe(1);
});

it('revokes every family and access token for only the selected user', function () use (
    $createRefreshToken
): void {
    $selectedUser = User::factory()->create();
    $otherUser = User::factory()->create();

    $selectedUser->createToken('selected-access-one');
    $selectedUser->createToken('selected-access-two');
    $otherUser->createToken('other-access');

    $selectedFirst = $createRefreshToken(
        $selectedUser,
        'selected-refresh-one'
    );

    $selectedSecond = $createRefreshToken(
        $selectedUser,
        'selected-refresh-two'
    );

    $otherToken = $createRefreshToken(
        $otherUser,
        'other-refresh-token'
    );

    app(RefreshTokenService::class)->revokeAllForUser(
        $selectedUser->id
    );

    expect($selectedFirst->fresh()->revoked_at)->not->toBeNull()
        ->and($selectedSecond->fresh()->revoked_at)->not->toBeNull()
        ->and($selectedUser->tokens()->count())->toBe(0)
        ->and($otherToken->fresh()->revoked_at)->toBeNull()
        ->and($otherUser->tokens()->count())->toBe(1);
});