<?php

use App\Models\StoreStatus;
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

function makeStoreAdmin(): User
{
    $staff = User::factory()->staff()->create();
    Permission::firstOrCreate(['name' => 'store.manage-status', 'guard_name' => 'sanctum']);
    $staff->givePermissionTo('store.manage-status');
    return $staff;
}

function makeStaffWithoutPermission(): User
{
    return User::factory()->staff()->create();
}

function makeCustomer(): User
{
    return User::factory()->create();
}

function seedStoreStatus(bool $isOpen = true): StoreStatus
{
    return StoreStatus::updateOrCreate(
        ['id' => 1],
        ['is_open' => $isOpen]
    );
}

// ---------------------------------------------------------------------------
// SHOW — GET /api/v1/admin/store-status
// ---------------------------------------------------------------------------

describe('StoreStatusController::show', function () {

    it('admin can view current store status', function () {
        $admin = makeStoreAdmin();
        seedStoreStatus(true);

        $this->actingAs($admin)->getJson('/api/v1/admin/store-status')
            ->assertOk()
            ->assertJsonPath('data.is_open', true);
    });

    it('always has exactly one singleton row and returns open by default', function () {
        $admin = makeStoreAdmin();

        $this->actingAs($admin)->getJson('/api/v1/admin/store-status')
            ->assertOk()
            ->assertJsonPath('data.is_open', true);

        $this->assertDatabaseCount('store_statuses', 1);
    });

    it('staff without permission cannot view store status', function () {
        $staff = makeStaffWithoutPermission();

        $this->actingAs($staff)->getJson('/api/v1/admin/store-status')
            ->assertForbidden();
    });

    it('regular customer cannot view store status', function () {
        $customer = makeCustomer();

        $this->actingAs($customer)->getJson('/api/v1/admin/store-status')
            ->assertForbidden();
    });

    it('unauthenticated request is rejected', function () {
        $this->getJson('/api/v1/admin/store-status')
            ->assertUnauthorized();
    });

});

// ---------------------------------------------------------------------------
// CLOSE — POST /api/v1/admin/store-status/close
// ---------------------------------------------------------------------------

describe('StoreStatusController::close', function () {

    it('admin can close the store', function () {
        $admin = makeStoreAdmin();
        seedStoreStatus(true);

        $this->actingAs($admin)->postJson('/api/v1/admin/store-status/close', [
            'reason' => 'Maintenance',
        ])->assertOk()
          ->assertJsonPath('data.is_open', false);

        $this->assertDatabaseHas('store_statuses', [
            'id'      => 1,
            'is_open' => false,
        ]);
    });

    it('close records the reason in database', function () {
        $admin = makeStoreAdmin();
        seedStoreStatus(true);

        $this->actingAs($admin)->postJson('/api/v1/admin/store-status/close', [
            'reason' => 'Holiday break',
        ])->assertOk();

        $this->assertDatabaseHas('store_statuses', [
            'id'            => 1,
            'closed_reason' => 'Holiday break',
        ]);
    });

    it('close records which admin closed the store', function () {
        $admin = makeStoreAdmin();
        seedStoreStatus(true);

        $this->actingAs($admin)->postJson('/api/v1/admin/store-status/close')
            ->assertOk();

        $this->assertDatabaseHas('store_statuses', [
            'id'                 => 1,
            'closed_by_user_id'  => $admin->id,
        ]);
    });

    it('close sets closed_at timestamp', function () {
        $admin = makeStoreAdmin();
        seedStoreStatus(true);

        $this->actingAs($admin)->postJson('/api/v1/admin/store-status/close')
            ->assertOk();

        $status = StoreStatus::find(1);
        expect($status->closed_at)->not->toBeNull();
    });

    it('reason is optional when closing', function () {
        $admin = makeStoreAdmin();
        seedStoreStatus(true);

        $this->actingAs($admin)->postJson('/api/v1/admin/store-status/close')
            ->assertOk()
            ->assertJsonPath('data.is_open', false);
    });

    it('reason max 255 chars is enforced', function () {
        $admin = makeStoreAdmin();
        seedStoreStatus(true);

        $this->actingAs($admin)->postJson('/api/v1/admin/store-status/close', [
            'reason' => str_repeat('a', 256),
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['reason']);
    });

    it('closing already-closed store is idempotent', function () {
        $admin = makeStoreAdmin();
        seedStoreStatus(false);

        $this->actingAs($admin)->postJson('/api/v1/admin/store-status/close', [
            'reason' => 'Still closed',
        ])->assertOk()
          ->assertJsonPath('data.is_open', false);
    });

    it('staff without permission cannot close the store', function () {
        $staff = makeStaffWithoutPermission();
        seedStoreStatus(true);

        $this->actingAs($staff)->postJson('/api/v1/admin/store-status/close')
            ->assertForbidden();

        $this->assertDatabaseHas('store_statuses', ['is_open' => true]);
    });

    it('regular customer cannot close the store', function () {
        $customer = makeCustomer();
        seedStoreStatus(true);

        $this->actingAs($customer)->postJson('/api/v1/admin/store-status/close')
            ->assertForbidden();
    });

    it('unauthenticated request is rejected', function () {
        $this->postJson('/api/v1/admin/store-status/close')
            ->assertUnauthorized();
    });

    it('only one store_statuses row exists after multiple closes', function () {
        $admin = makeStoreAdmin();

        $this->actingAs($admin)->postJson('/api/v1/admin/store-status/close')->assertOk();
        $this->actingAs($admin)->postJson('/api/v1/admin/store-status/close')->assertOk();
        $this->actingAs($admin)->postJson('/api/v1/admin/store-status/close')->assertOk();

        $this->assertDatabaseCount('store_statuses', 1);
    });

});

// ---------------------------------------------------------------------------
// OPEN — POST /api/v1/admin/store-status/open
// ---------------------------------------------------------------------------

describe('StoreStatusController::open', function () {

    it('admin can open the store', function () {
        $admin = makeStoreAdmin();
        seedStoreStatus(false);

        $this->actingAs($admin)->postJson('/api/v1/admin/store-status/open')
            ->assertOk()
            ->assertJsonPath('data.is_open', true);

        $this->assertDatabaseHas('store_statuses', [
            'id'      => 1,
            'is_open' => true,
        ]);
    });

    it('open clears closed_reason and closed_at', function () {
        $admin = makeStoreAdmin();
        $status = seedStoreStatus(false);
        $status->update([
            'closed_reason' => 'Maintenance',
            'closed_at'     => now()->subHour(),
        ]);

        $this->actingAs($admin)->postJson('/api/v1/admin/store-status/open')
            ->assertOk();

        $this->assertDatabaseHas('store_statuses', [
            'id'            => 1,
            'is_open'       => true,
            'closed_reason' => null,
            'closed_at'     => null,
        ]);
    });

    it('open records which admin opened the store', function () {
        $admin = makeStoreAdmin();
        seedStoreStatus(false);

        $this->actingAs($admin)->postJson('/api/v1/admin/store-status/open')
            ->assertOk();

        $this->assertDatabaseHas('store_statuses', [
            'id'                => 1,
            'closed_by_user_id' => $admin->id,
        ]);
    });

    it('opening already-open store is idempotent', function () {
        $admin = makeStoreAdmin();
        seedStoreStatus(true);

        $this->actingAs($admin)->postJson('/api/v1/admin/store-status/open')
            ->assertOk()
            ->assertJsonPath('data.is_open', true);
    });

    it('staff without permission cannot open the store', function () {
        $staff = makeStaffWithoutPermission();
        seedStoreStatus(false);

        $this->actingAs($staff)->postJson('/api/v1/admin/store-status/open')
            ->assertForbidden();

        $this->assertDatabaseHas('store_statuses', ['is_open' => false]);
    });

    it('regular customer cannot open the store', function () {
        $customer = makeCustomer();
        seedStoreStatus(false);

        $this->actingAs($customer)->postJson('/api/v1/admin/store-status/open')
            ->assertForbidden();
    });

    it('unauthenticated request is rejected', function () {
        $this->postJson('/api/v1/admin/store-status/open')
            ->assertUnauthorized();
    });

    it('only one store_statuses row exists after open/close cycle', function () {
        $admin = makeStoreAdmin();

        $this->actingAs($admin)->postJson('/api/v1/admin/store-status/close')->assertOk();
        $this->actingAs($admin)->postJson('/api/v1/admin/store-status/open')->assertOk();
        $this->actingAs($admin)->postJson('/api/v1/admin/store-status/close')->assertOk();
        $this->actingAs($admin)->postJson('/api/v1/admin/store-status/open')->assertOk();

        $this->assertDatabaseCount('store_statuses', 1);
    });

    // --- Security ---

    it('response does not leak other admin sensitive fields', function () {
        $admin = makeStoreAdmin();
        seedStoreStatus(false);

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/store-status/open')
            ->assertOk();

        $data = $response->json('data');
        expect($data)->not->toHaveKey('password');
        expect($data)->not->toHaveKey('operation_password_hash');
    });

});

// ---------------------------------------------------------------------------
// StoreStatusService::isOpen — used by Checkout
// ---------------------------------------------------------------------------

describe('StoreStatusService::isOpen', function () {

    it('returns true when store is open', function () {
        seedStoreStatus(true);
        expect(app(\App\Services\StoreStatusService::class)->isOpen())->toBeTrue();
    });

    it('returns false when store is closed', function () {
        seedStoreStatus(false);
        expect(app(\App\Services\StoreStatusService::class)->isOpen())->toBeFalse();
    });

    it('returns true by default (singleton row is always open on fresh state)', function () {
        // Migration seeds one open row — isOpen() must return true
        expect(app(\App\Services\StoreStatusService::class)->isOpen())->toBeTrue();
        $this->assertDatabaseCount('store_statuses', 1);
    });

});

// ---------------------------------------------------------------------------
// Integration with Checkout
// ---------------------------------------------------------------------------

describe('Store status integration', function () {

    it('StoreStatusService::isOpen returns false after admin closes store', function () {
        $admin = makeStoreAdmin();
        seedStoreStatus(true);

        $this->actingAs($admin)->postJson('/api/v1/admin/store-status/close', [
            'reason' => 'Emergency',
        ])->assertOk();

        expect(app(\App\Services\StoreStatusService::class)->isOpen())->toBeFalse();
    });

    it('StoreStatusService::isOpen returns true after admin opens store', function () {
        $admin = makeStoreAdmin();
        seedStoreStatus(false);

        $this->actingAs($admin)->postJson('/api/v1/admin/store-status/open')
            ->assertOk();

        expect(app(\App\Services\StoreStatusService::class)->isOpen())->toBeTrue();
    });

});
