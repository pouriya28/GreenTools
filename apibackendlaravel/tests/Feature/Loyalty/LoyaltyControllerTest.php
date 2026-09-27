<?php

use App\Models\CustomerLevel;
use App\Models\LoyaltyPointTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    Http::preventStrayRequests();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLoyaltyAdmin(): User
{
    $staff = User::factory()->staff()->create();
    Permission::firstOrCreate(['name' => 'loyalty.manage', 'guard_name' => 'sanctum']);
    $staff->givePermissionTo('loyalty.manage');
    return $staff;
}

function makeCustomer(): User
{
    return User::factory()->create(['loyalty_points' => 0]);
}

function makeLevel(int $minPoints, ?int $maxPoints = null, string $code = 'silver'): CustomerLevel
{
    return CustomerLevel::create([
        'code'       => $code . '_' . $minPoints,
        'name'       => ucfirst($code),
        'min_points' => $minPoints,
        'max_points' => $maxPoints,
        'sort_order' => 1,
        'is_active'  => true,
    ]);
}

/**
 * Act as a staff user with operation password already verified in Redis.
 * Returns the token ID so callers can assert on it if needed.
 */
function actingAsVerifiedAdmin(object $testCase, User $admin): string
{
    $token   = $admin->createToken('test')->plainTextToken;
    $tokenId = $admin->tokens()->latest()->first()->id;

    Redis::shouldReceive('get')
        ->with("op_verified:{$admin->id}:{$tokenId}")
        ->andReturn('1');

    $testCase->withToken($token);

    return $tokenId;
}

// ---------------------------------------------------------------------------
// GRANT — POST /api/v1/admin/loyalty/grant
// ---------------------------------------------------------------------------

describe('LoyaltyController::grant', function () {

    it('staff with loyalty.manage can grant points to a user', function () {
        $admin    = makeLoyaltyAdmin();
        $customer = makeCustomer();
        actingAsVerifiedAdmin($this, $admin);

        $this->postJson('/api/v1/admin/loyalty/grant', [
            'user_id'     => $customer->id,
            'points'      => 100,
            'description' => 'Test grant',
        ])->assertOk()
          ->assertJsonPath('data.user_id', $customer->id)
          ->assertJsonPath('data.loyalty_points', 100);
    });

    it('loyalty_points is correctly incremented in the database', function () {
        $admin    = makeLoyaltyAdmin();
        $customer = makeCustomer();
        actingAsVerifiedAdmin($this, $admin);

        $this->postJson('/api/v1/admin/loyalty/grant', [
            'user_id' => $customer->id,
            'points'  => 50,
        ])->assertOk();

        expect($customer->fresh()->loyalty_points)->toBe(50);
    });

    it('successive grants accumulate correctly', function () {
        $admin    = makeLoyaltyAdmin();
        $customer = makeCustomer();

        // First grant
        $token   = $admin->createToken('test')->plainTextToken;
        $tokenId = $admin->tokens()->latest()->first()->id;
        Redis::shouldReceive('get')
            ->with("op_verified:{$admin->id}:{$tokenId}")
            ->andReturn('1');

        $this->withToken($token)->postJson('/api/v1/admin/loyalty/grant', [
            'user_id' => $customer->id,
            'points'  => 100,
        ])->assertOk();

        $this->withToken($token)->postJson('/api/v1/admin/loyalty/grant', [
            'user_id' => $customer->id,
            'points'  => 200,
        ])->assertOk();

        expect($customer->fresh()->loyalty_points)->toBe(300);
    });

    it('creates a loyalty_point_transaction record', function () {
        $admin    = makeLoyaltyAdmin();
        $customer = makeCustomer();
        actingAsVerifiedAdmin($this, $admin);

        $this->postJson('/api/v1/admin/loyalty/grant', [
            'user_id'     => $customer->id,
            'points'      => 75,
            'description' => 'Special reward',
        ])->assertOk();

        $this->assertDatabaseHas('loyalty_point_transactions', [
            'user_id'     => $customer->id,
            'type'        => 'manual_admin_grant',
            'points'      => 75,
            'description' => 'Special reward',
            'granted_by'  => $admin->id,
        ]);
    });

    it('transaction record has no updated_at column', function () {
        $admin    = makeLoyaltyAdmin();
        $customer = makeCustomer();
        actingAsVerifiedAdmin($this, $admin);

        $this->postJson('/api/v1/admin/loyalty/grant', [
            'user_id' => $customer->id,
            'points'  => 10,
        ])->assertOk();

        $tx = LoyaltyPointTransaction::where('user_id', $customer->id)->first();
        expect($tx->updated_at)->toBeNull();
    });

    it('upgrades customer level when threshold is crossed', function () {
        $admin    = makeLoyaltyAdmin();
        $customer = makeCustomer();
        $level    = makeLevel(minPoints: 100, maxPoints: null, code: 'gold');
        actingAsVerifiedAdmin($this, $admin);

        $this->postJson('/api/v1/admin/loyalty/grant', [
            'user_id' => $customer->id,
            'points'  => 150,
        ])->assertOk()
          ->assertJsonPath('data.customer_level.code', $level->code);

        expect($customer->fresh()->customer_level_id)->toBe($level->id);
    });

    it('does not change level when threshold is not crossed', function () {
        $admin    = makeLoyaltyAdmin();
        $customer = makeCustomer();
        makeLevel(minPoints: 500, maxPoints: null, code: 'gold');
        actingAsVerifiedAdmin($this, $admin);

        $response = $this->postJson('/api/v1/admin/loyalty/grant', [
            'user_id' => $customer->id,
            'points'  => 100,
        ])->assertOk();

        expect($response->json('data.customer_level'))->toBeNull();
        expect($customer->fresh()->customer_level_id)->toBeNull();
    });

    it('response customer_level contains only id, code, name', function () {
        $admin    = makeLoyaltyAdmin();
        $customer = makeCustomer();
        makeLevel(minPoints: 50, maxPoints: null, code: 'silver');
        actingAsVerifiedAdmin($this, $admin);

        $response = $this->postJson('/api/v1/admin/loyalty/grant', [
            'user_id' => $customer->id,
            'points'  => 100,
        ])->assertOk();

        $level = $response->json('data.customer_level');
        expect($level)->toHaveKeys(['id', 'code', 'name']);
        expect($level)->not->toHaveKey('min_points');
        expect($level)->not->toHaveKey('is_active');
    });

    // --- Validation ---

    it('requires user_id', function () {
        $admin = makeLoyaltyAdmin();
        actingAsVerifiedAdmin($this, $admin);

        $this->postJson('/api/v1/admin/loyalty/grant', [
            'points' => 100,
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['user_id']);
    });

    it('rejects non-existent user_id', function () {
        $admin = makeLoyaltyAdmin();
        actingAsVerifiedAdmin($this, $admin);

        $this->postJson('/api/v1/admin/loyalty/grant', [
            'user_id' => '01zzzzzzzzzzzzzzzzzzzzzzz1',
            'points'  => 100,
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['user_id']);
    });

    it('requires points', function () {
        $admin    = makeLoyaltyAdmin();
        $customer = makeCustomer();
        actingAsVerifiedAdmin($this, $admin);

        $this->postJson('/api/v1/admin/loyalty/grant', [
            'user_id' => $customer->id,
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['points']);
    });

    it('rejects zero points', function () {
        $admin    = makeLoyaltyAdmin();
        $customer = makeCustomer();
        actingAsVerifiedAdmin($this, $admin);

        $this->postJson('/api/v1/admin/loyalty/grant', [
            'user_id' => $customer->id,
            'points'  => 0,
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['points']);
    });

    it('rejects negative points', function () {
        $admin    = makeLoyaltyAdmin();
        $customer = makeCustomer();
        actingAsVerifiedAdmin($this, $admin);

        $this->postJson('/api/v1/admin/loyalty/grant', [
            'user_id' => $customer->id,
            'points'  => -10,
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['points']);
    });

    it('rejects points above max (100000)', function () {
        $admin    = makeLoyaltyAdmin();
        $customer = makeCustomer();
        actingAsVerifiedAdmin($this, $admin);

        $this->postJson('/api/v1/admin/loyalty/grant', [
            'user_id' => $customer->id,
            'points'  => 100001,
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['points']);
    });

    it('description is optional', function () {
        $admin    = makeLoyaltyAdmin();
        $customer = makeCustomer();
        actingAsVerifiedAdmin($this, $admin);

        $this->postJson('/api/v1/admin/loyalty/grant', [
            'user_id' => $customer->id,
            'points'  => 10,
        ])->assertOk();
    });

    it('description max 500 chars is enforced', function () {
        $admin    = makeLoyaltyAdmin();
        $customer = makeCustomer();
        actingAsVerifiedAdmin($this, $admin);

        $this->postJson('/api/v1/admin/loyalty/grant', [
            'user_id'     => $customer->id,
            'points'      => 10,
            'description' => str_repeat('a', 501),
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['description']);
    });

    // --- Authorization ---

    it('staff without loyalty.manage is forbidden', function () {
        $staff    = User::factory()->staff()->create();
        $customer = makeCustomer();

        $token   = $staff->createToken('test')->plainTextToken;
        $tokenId = $staff->tokens()->latest()->first()->id;
        Redis::shouldReceive('get')
            ->with("op_verified:{$staff->id}:{$tokenId}")
            ->andReturn('1');

        $this->withToken($token)->postJson('/api/v1/admin/loyalty/grant', [
            'user_id' => $customer->id,
            'points'  => 100,
        ])->assertForbidden();
    });

    it('regular customer cannot grant points', function () {
        $customer  = makeCustomer();
        $customer2 = makeCustomer();

        $this->actingAs($customer)->postJson('/api/v1/admin/loyalty/grant', [
            'user_id' => $customer2->id,
            'points'  => 100,
        ])->assertForbidden();
    });

    it('unauthenticated request is rejected', function () {
        $customer = makeCustomer();

        $this->postJson('/api/v1/admin/loyalty/grant', [
            'user_id' => $customer->id,
            'points'  => 100,
        ])->assertUnauthorized();
    });

    it('request without operation password verification returns 403', function () {
        $admin    = makeLoyaltyAdmin();
        $customer = makeCustomer();

        $token   = $admin->createToken('test')->plainTextToken;
        $tokenId = $admin->tokens()->latest()->first()->id;

        // Redis returns null — operation not verified
        Redis::shouldReceive('get')
            ->with("op_verified:{$admin->id}:{$tokenId}")
            ->andReturn(null);

        $this->withToken($token)->postJson('/api/v1/admin/loyalty/grant', [
            'user_id' => $customer->id,
            'points'  => 100,
        ])->assertForbidden()
          ->assertJsonPath('code', 'OPERATION_PASSWORD_REQUIRED');
    });

    // --- Security ---

    it('granted_by is taken from authenticated admin, not from request body', function () {
        $admin    = makeLoyaltyAdmin();
        $customer = makeCustomer();
        actingAsVerifiedAdmin($this, $admin);

        $this->postJson('/api/v1/admin/loyalty/grant', [
            'user_id' => $customer->id,
            'points'  => 50,
        ])->assertOk();

        $this->assertDatabaseHas('loyalty_point_transactions', [
            'user_id'    => $customer->id,
            'granted_by' => $admin->id,
        ]);
    });

    it('loyalty_points column starts at 0 for new users', function () {
        $customer = makeCustomer();
        expect($customer->fresh()->loyalty_points)->toBe(0);
    });

});
