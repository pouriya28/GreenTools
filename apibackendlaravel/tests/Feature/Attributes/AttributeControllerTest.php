<?php

use App\Models\Attribute;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    Http::preventStrayRequests();
});

function makeStaffUser(): User
{
    return User::factory()->staff()->create();
}

function makeAttr(array $attrs = []): Attribute
{
    return Attribute::create(array_merge([
        'name'       => 'رنگ',
        'unit'       => null,
        'sort_order' => 0,
    ], $attrs));
}

describe('AttributeController::index', function () {

    it('staff can list all attributes', function () {
        $staff = makeStaffUser();
        makeAttr(['name' => 'رنگ']);
        makeAttr(['name' => 'توان', 'unit' => 'وات']);
        makeAttr(['name' => 'وزن', 'unit' => 'کیلوگرم']);

        $this->actingAs($staff)->getJson('/api/v1/admin/attributes')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    });

    it('returns empty list when no attributes exist', function () {
        $staff = makeStaffUser();

        $this->actingAs($staff)->getJson('/api/v1/admin/attributes')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    });

    it('returns attributes ordered by sort_order then name', function () {
        $staff = makeStaffUser();
        makeAttr(['name' => 'رنگ',  'sort_order' => 2]);
        makeAttr(['name' => 'آمپر', 'sort_order' => 1]);
        makeAttr(['name' => 'توان', 'sort_order' => 1]);

        $response = $this->actingAs($staff)->getJson('/api/v1/admin/attributes')
            ->assertOk();

        $names = collect($response->json('data'))->pluck('name')->toArray();
        expect($names[0])->toBe('آمپر');
        expect($names[2])->toBe('رنگ');
    });

    it('response contains id, name, unit fields', function () {
        $staff = makeStaffUser();
        makeAttr(['name' => 'توان', 'unit' => 'وات']);

        $response = $this->actingAs($staff)->getJson('/api/v1/admin/attributes')
            ->assertOk();

        $item = $response->json('data.0');
        expect($item)->toHaveKeys(['id', 'name', 'unit']);
    });

    it('unit can be null', function () {
        $staff = makeStaffUser();
        makeAttr(['name' => 'رنگ', 'unit' => null]);

        $response = $this->actingAs($staff)->getJson('/api/v1/admin/attributes')
            ->assertOk();

        expect($response->json('data.0.unit'))->toBeNull();
    });

    it('response does not include sort_order or timestamps', function () {
        $staff = makeStaffUser();
        makeAttr();

        $response = $this->actingAs($staff)->getJson('/api/v1/admin/attributes')
            ->assertOk();

        $item = $response->json('data.0');
        expect($item)->not->toHaveKey('sort_order');
        expect($item)->not->toHaveKey('created_at');
        expect($item)->not->toHaveKey('updated_at');
    });

    it('regular customer cannot access attributes', function () {
        $customer = User::factory()->create();

        $this->actingAs($customer)->getJson('/api/v1/admin/attributes')
            ->assertForbidden();
    });

    it('unauthenticated request is rejected', function () {
        $this->getJson('/api/v1/admin/attributes')
            ->assertUnauthorized();
    });

});