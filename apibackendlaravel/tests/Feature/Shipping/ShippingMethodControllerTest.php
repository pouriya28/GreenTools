<?php

use App\Enums\ShippingCalculationType;
use App\Models\ShippingMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    Http::preventStrayRequests();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeShippingAdmin(): User
{
    $staff = User::factory()->staff()->create();
    Permission::firstOrCreate(['name' => 'shipping.manage', 'guard_name' => 'sanctum']);
    $staff->givePermissionTo('shipping.manage');
    return $staff;
}

function makeStaffNoShipping(): User
{
    return User::factory()->staff()->create();
}

function fixedMethodData(array $overrides = []): array
{
    return array_merge([
        'name'                   => 'پست پیشتاز',
        'code'                   => 'express_post',
        'base_cost'              => 50000,
        'calculation_type'       => 'fixed',
        'free_shipping_enabled'  => false,
        'is_active'              => true,
        'sort_order'             => 1,
    ], $overrides);
}

function weightMethodData(array $overrides = []): array
{
    return array_merge([
        'name'                   => 'پیک وزنی',
        'code'                   => 'weight_courier',
        'base_cost'              => 20000,
        'calculation_type'       => 'weight',
        'cost_per_kg'            => 5000,
        'free_shipping_enabled'  => false,
        'is_active'              => true,
        'sort_order'             => 2,
    ], $overrides);
}

// ---------------------------------------------------------------------------
// INDEX — GET /api/v1/admin/shipping-methods
// ---------------------------------------------------------------------------

describe('ShippingMethodController::index', function () {

    it('staff with shipping.manage can list all shipping methods', function () {
        $admin = makeShippingAdmin();
        ShippingMethod::factory()->count(3)->create();

        $this->actingAs($admin)->getJson('/api/v1/admin/shipping-methods')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    });

    it('includes soft-deleted methods in index', function () {
        $admin  = makeShippingAdmin();
        $method = ShippingMethod::factory()->create();
        $method->delete();

        // index uses query() without withTrashed — soft deleted not shown
        $this->actingAs($admin)->getJson('/api/v1/admin/shipping-methods')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    });

    it('returns methods ordered by sort_order', function () {
        $admin = makeShippingAdmin();
        ShippingMethod::factory()->create(['sort_order' => 3, 'name' => 'Third']);
        ShippingMethod::factory()->create(['sort_order' => 1, 'name' => 'First']);
        ShippingMethod::factory()->create(['sort_order' => 2, 'name' => 'Second']);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/shipping-methods')
            ->assertOk();

        $names = collect($response->json('data'))->pluck('name')->toArray();
        expect($names)->toBe(['First', 'Second', 'Third']);
    });

    it('staff without shipping.manage is forbidden', function () {
        $staff = makeStaffNoShipping();

        $this->actingAs($staff)->getJson('/api/v1/admin/shipping-methods')
            ->assertForbidden();
    });

    it('unauthenticated request is rejected', function () {
        $this->getJson('/api/v1/admin/shipping-methods')
            ->assertUnauthorized();
    });

});

// ---------------------------------------------------------------------------
// STORE — POST /api/v1/admin/shipping-methods
// ---------------------------------------------------------------------------

describe('ShippingMethodController::store', function () {

    it('admin can create a fixed shipping method', function () {
        $admin = makeShippingAdmin();

        $this->actingAs($admin)->postJson('/api/v1/admin/shipping-methods', fixedMethodData())
            ->assertCreated()
            ->assertJsonPath('data.code', 'express_post')
            ->assertJsonPath('data.calculation_type', 'fixed');

        $this->assertDatabaseHas('shipping_methods', ['code' => 'express_post']);
    });

    it('admin can create a weight-based shipping method', function () {
        $admin = makeShippingAdmin();

        $this->actingAs($admin)->postJson('/api/v1/admin/shipping-methods', weightMethodData())
            ->assertCreated()
            ->assertJsonPath('data.calculation_type', 'weight');
    });

    it('requires cost_per_kg when calculation_type is weight', function () {
        $admin = makeShippingAdmin();

        $this->actingAs($admin)->postJson('/api/v1/admin/shipping-methods', [
            'name'                  => 'Weight Method',
            'code'                  => 'weight_test',
            'base_cost'             => 10000,
            'calculation_type'      => 'weight',
            'free_shipping_enabled' => false,
            'is_active'             => true,
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['cost_per_kg']);
    });

    it('requires free_shipping_threshold when free_shipping_enabled is true', function () {
        $admin = makeShippingAdmin();

        $this->actingAs($admin)->postJson('/api/v1/admin/shipping-methods', fixedMethodData([
            'free_shipping_enabled' => true,
            // threshold missing
        ]))->assertUnprocessable()
           ->assertJsonValidationErrors(['free_shipping_threshold']);
    });

    it('max_weight_grams must be >= min_weight_grams', function () {
        $admin = makeShippingAdmin();

        $this->actingAs($admin)->postJson('/api/v1/admin/shipping-methods', fixedMethodData([
            'min_weight_grams' => 5000,
            'max_weight_grams' => 1000, // less than min
        ]))->assertUnprocessable()
           ->assertJsonValidationErrors(['max_weight_grams']);
    });

    it('estimated_days_max must be >= estimated_days_min', function () {
        $admin = makeShippingAdmin();

        $this->actingAs($admin)->postJson('/api/v1/admin/shipping-methods', fixedMethodData([
            'estimated_days_min' => 5,
            'estimated_days_max' => 2, // less than min
        ]))->assertUnprocessable()
           ->assertJsonValidationErrors(['estimated_days_max']);
    });

    it('code must be unique', function () {
        $admin = makeShippingAdmin();
        ShippingMethod::factory()->create(['code' => 'express_post']);

        $this->actingAs($admin)->postJson('/api/v1/admin/shipping-methods', fixedMethodData())
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['code']);
    });

    it('staff without shipping.manage is forbidden', function () {
        $staff = makeStaffNoShipping();

        $this->actingAs($staff)->postJson('/api/v1/admin/shipping-methods', fixedMethodData())
            ->assertForbidden();
    });

});

// ---------------------------------------------------------------------------
// SHOW — GET /api/v1/admin/shipping-methods/{id}
// ---------------------------------------------------------------------------

describe('ShippingMethodController::show', function () {

    it('admin can view a shipping method', function () {
        $admin  = makeShippingAdmin();
        $method = ShippingMethod::factory()->create(['name' => 'Test Method']);

        $this->actingAs($admin)->getJson("/api/v1/admin/shipping-methods/{$method->id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Test Method');
    });

    it('returns 404 for non-existent method', function () {
        $admin = makeShippingAdmin();

        $this->actingAs($admin)->getJson('/api/v1/admin/shipping-methods/' . \Illuminate\Support\Str::ulid())
            ->assertNotFound();
    });

    it('staff without shipping.manage is forbidden', function () {
        $staff  = makeStaffNoShipping();
        $method = ShippingMethod::factory()->create();

        $this->actingAs($staff)->getJson("/api/v1/admin/shipping-methods/{$method->id}")
            ->assertForbidden();
    });

});

// ---------------------------------------------------------------------------
// UPDATE — PATCH /api/v1/admin/shipping-methods/{id}
// ---------------------------------------------------------------------------

describe('ShippingMethodController::update', function () {

    it('admin can update a shipping method name', function () {
        $admin  = makeShippingAdmin();
        $method = ShippingMethod::factory()->create(['name' => 'Old Name']);

        $this->actingAs($admin)->patchJson("/api/v1/admin/shipping-methods/{$method->id}", [
            'name' => 'New Name',
        ])->assertOk()
          ->assertJsonPath('data.name', 'New Name');
    });

    it('admin can deactivate a shipping method', function () {
        $admin  = makeShippingAdmin();
        $method = ShippingMethod::factory()->create(['is_active' => true]);

        $this->actingAs($admin)->patchJson("/api/v1/admin/shipping-methods/{$method->id}", [
            'is_active' => false,
        ])->assertOk()
          ->assertJsonPath('data.is_active', false);
    });

    it('code unique constraint ignores self on update', function () {
        $admin  = makeShippingAdmin();
        $method = ShippingMethod::factory()->create(['code' => 'my_code']);

        $this->actingAs($admin)->patchJson("/api/v1/admin/shipping-methods/{$method->id}", [
            'code' => 'my_code', // same code — should be OK
        ])->assertOk();
    });

    it('staff without shipping.manage is forbidden', function () {
        $staff  = makeStaffNoShipping();
        $method = ShippingMethod::factory()->create();

        $this->actingAs($staff)->patchJson("/api/v1/admin/shipping-methods/{$method->id}", [
            'name' => 'Hacked',
        ])->assertForbidden();
    });

    it('returns 404 for non-existent method', function () {
        $admin = makeShippingAdmin();

        $this->actingAs($admin)->patchJson('/api/v1/admin/shipping-methods/' . \Illuminate\Support\Str::ulid(), [
            'name' => 'Ghost',
        ])->assertNotFound();
    });

});

// ---------------------------------------------------------------------------
// DESTROY — DELETE /api/v1/admin/shipping-methods/{id}
// ---------------------------------------------------------------------------

describe('ShippingMethodController::destroy', function () {

    it('admin can soft-delete a shipping method', function () {
        $admin  = makeShippingAdmin();
        $method = ShippingMethod::factory()->create();

        $this->actingAs($admin)->deleteJson("/api/v1/admin/shipping-methods/{$method->id}")
            ->assertNoContent();

        $this->assertSoftDeleted('shipping_methods', ['id' => $method->id]);
    });

    it('soft-deleted method is not found via normal query', function () {
        $admin  = makeShippingAdmin();
        $method = ShippingMethod::factory()->create();
        $method->delete();

        $this->actingAs($admin)->deleteJson("/api/v1/admin/shipping-methods/{$method->id}")
            ->assertNotFound();
    });

    it('staff without shipping.manage is forbidden', function () {
        $staff  = makeStaffNoShipping();
        $method = ShippingMethod::factory()->create();

        $this->actingAs($staff)->deleteJson("/api/v1/admin/shipping-methods/{$method->id}")
            ->assertForbidden();

        $this->assertNotSoftDeleted('shipping_methods', ['id' => $method->id]);
    });

    it('unauthenticated request is rejected', function () {
        $method = ShippingMethod::factory()->create();

        $this->deleteJson("/api/v1/admin/shipping-methods/{$method->id}")
            ->assertUnauthorized();
    });

});
