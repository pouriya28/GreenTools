<?php

use App\Models\CustomerLevel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    Http::preventStrayRequests();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCustomerWithPoints(int $points = 0): User
{
    return User::factory()->create([
        'user_type'     => 'customer',
        'loyalty_points' => $points,
    ]);
}

function makeLoyaltyLevel(string $code, int $minPoints, ?int $maxPoints = null, int $sortOrder = 1): CustomerLevel
{
    return CustomerLevel::create([
        'code'       => $code,
        'name'       => ucfirst($code),
        'icon'       => null,
        'min_points' => $minPoints,
        'max_points' => $maxPoints,
        'sort_order' => $sortOrder,
        'is_active'  => true,
    ]);
}

// ---------------------------------------------------------------------------
// GET /loyalty/me
// ---------------------------------------------------------------------------

describe('CustomerLoyaltyController::me', function () {

    it('authenticated customer can view their loyalty info', function () {
        $user = makeCustomerWithPoints(100);

        $this->actingAs($user)->getJson('/api/v1/auth/customer/loyalty/me')
            ->assertOk()
            ->assertJsonPath('data.points', 100);
    });

    it('returns points as integer', function () {
        $user = makeCustomerWithPoints(250);

        $response = $this->actingAs($user)->getJson('/api/v1/auth/customer/loyalty/me')->assertOk();

        expect($response->json('data.points'))->toBe(250);
    });

    it('returns null level when no level configured', function () {
        $user = makeCustomerWithPoints(0);

        $response = $this->actingAs($user)->getJson('/api/v1/auth/customer/loyalty/me')->assertOk();

        expect($response->json('data.level'))->toBeNull();
    });

    it('returns current level when user has enough points', function () {
        $user  = makeCustomerWithPoints(200);
        $level = makeLoyaltyLevel('silver', 100, null, 1);

        // assign level
        $user->update(['customer_level_id' => $level->id]);

        $response = $this->actingAs($user)->getJson('/api/v1/auth/customer/loyalty/me')->assertOk();

        expect($response->json('data.level.code'))->toBe('silver');
        expect($response->json('data.level.name'))->toBe('Silver');
    });

    it('returns next_level info when a higher level exists', function () {
        $user    = makeCustomerWithPoints(100);
        $current = makeLoyaltyLevel('silver', 0,   499, 1);
        $next    = makeLoyaltyLevel('gold',   500, null, 2);
        $user->update(['customer_level_id' => $current->id]);

        $response = $this->actingAs($user)->getJson('/api/v1/auth/customer/loyalty/me')->assertOk();

        expect($response->json('data.next_level.code'))->toBe('gold');
        expect($response->json('data.next_level.points_required'))->toBe(500);
        expect($response->json('data.next_level.points_remaining'))->toBe(400);
    });

    it('returns null next_level when user is at highest level', function () {
        $user  = makeCustomerWithPoints(1000);
        $level = makeLoyaltyLevel('gold', 500, null, 1);
        $user->update(['customer_level_id' => $level->id]);

        $response = $this->actingAs($user)->getJson('/api/v1/auth/customer/loyalty/me')->assertOk();

        expect($response->json('data.next_level'))->toBeNull();
    });

    it('calculates progress_percent correctly', function () {
        // current level: 0-499, next level: 500+
        // user has 250 points → progress = (250-0)/(500-0) * 100 = 50%
        $user    = makeCustomerWithPoints(250);
        $current = makeLoyaltyLevel('bronze', 0,   499, 1);
        $next    = makeLoyaltyLevel('silver', 500, null, 2);
        $user->update(['customer_level_id' => $current->id]);

        $response = $this->actingAs($user)->getJson('/api/v1/auth/customer/loyalty/me')->assertOk();

        expect($response->json('data.progress_percent'))->toBe(50);
    });

    it('progress_percent is null when no next level', function () {
        $user  = makeCustomerWithPoints(1000);
        $level = makeLoyaltyLevel('gold', 500, null, 1);
        $user->update(['customer_level_id' => $level->id]);

        $response = $this->actingAs($user)->getJson('/api/v1/auth/customer/loyalty/me')->assertOk();

        expect($response->json('data.progress_percent'))->toBeNull();
    });

    it('progress_percent is capped at 100', function () {
        $user    = makeCustomerWithPoints(999);
        $current = makeLoyaltyLevel('bronze', 0,   499, 1);
        $next    = makeLoyaltyLevel('silver', 500, null, 2);
        $user->update(['customer_level_id' => $current->id]);

        $response = $this->actingAs($user)->getJson('/api/v1/auth/customer/loyalty/me')->assertOk();

        expect($response->json('data.progress_percent'))->toBeLessThanOrEqual(100);
    });

    it('returns null data for staff accounts', function () {
        $staff = User::factory()->staff()->create(['loyalty_points' => 100]);

        $response = $this->actingAs($staff)->getJson('/api/v1/auth/customer/loyalty/me');

        // staff.access middleware blocks staff from customer routes
        $response->assertForbidden();
    });

    it('unauthenticated request is rejected', function () {
        $this->getJson('/api/v1/auth/customer/loyalty/me')->assertUnauthorized();
    });

    it('newly registered user with zero points has correct response', function () {
        $user = makeCustomerWithPoints(0);

        $response = $this->actingAs($user)->getJson('/api/v1/auth/customer/loyalty/me')->assertOk();

        expect($response->json('data.points'))->toBe(0);
        expect($response->json('data.level'))->toBeNull();
        expect($response->json('data.next_level'))->toBeNull();
        expect($response->json('data.progress_percent'))->toBeNull();
    });

    it('loyalty_points defaults to 0 when null in database', function () {
        $user = User::factory()->create(['user_type' => 'customer', 'loyalty_points' => 0]);

        $response = $this->actingAs($user)->getJson('/api/v1/auth/customer/loyalty/me')->assertOk();

        expect($response->json('data.points'))->toBe(0);
    });

    it('response contains expected keys', function () {
        $user = makeCustomerWithPoints(50);

        $response = $this->actingAs($user)->getJson('/api/v1/auth/customer/loyalty/me')->assertOk();

        $data = $response->json('data');
        expect($data)->toHaveKeys(['points', 'level', 'next_level', 'progress_percent']);
    });

});
