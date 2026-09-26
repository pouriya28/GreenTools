<?php

use App\Models\Address;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProvinceAndCity(): array
{
    $provinceId = DB::table('provinces')->insertGetId([
        'name'       => 'Province-' . \Illuminate\Support\Str::random(8),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $cityId = DB::table('cities')->insertGetId([
        'province_id' => $provinceId,
        'name'        => 'City-' . \Illuminate\Support\Str::random(8),
        'created_at'  => now(),
        'updated_at'  => now(),
    ]);

    return [$provinceId, $cityId];
}

function addressPayload(int $provinceId, int $cityId, array $overrides = []): array
{
    return array_merge([
        'recipient_name'  => 'علی رضایی',
        'recipient_phone' => '09121234567',
        'province_id'     => $provinceId,
        'city_id'         => $cityId,
        'address_line'    => 'خیابان ولیعصر، پلاک ۱۲، واحد ۳',
    ], $overrides);
}

function makeCustomerAddress(User $user, array $overrides = []): Address
{
    [$provinceId, $cityId] = makeProvinceAndCity();
    return Address::factory()->create(array_merge([
        'user_id'     => $user->id,
        'province_id' => $provinceId,
        'city_id'     => $cityId,
        'is_default'  => false,
    ], $overrides));
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(function (): void {
    Http::preventStrayRequests();
});

// ---------------------------------------------------------------------------
// index
// ---------------------------------------------------------------------------

it('returns all addresses for the authenticated customer', function (): void {
    $customer = User::factory()->customer()->create();
    makeCustomerAddress($customer);
    makeCustomerAddress($customer);

    $other = User::factory()->customer()->create();
    makeCustomerAddress($other); // should not appear

    $this->actingAs($customer)
        ->getJson('/api/v1/addresses')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('returns empty list when customer has no addresses', function (): void {
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)
        ->getJson('/api/v1/addresses')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

it('returns 401 for unauthenticated requests', function (): void {
    $this->getJson('/api/v1/addresses')->assertStatus(401);
});

it('returns 403 when staff hits the customer address endpoint', function (): void {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->getJson('/api/v1/addresses')
        ->assertStatus(403);
});

// ---------------------------------------------------------------------------
// store
// ---------------------------------------------------------------------------

it('creates an address and returns 201', function (): void {
    $customer            = User::factory()->customer()->create();
    [$provinceId, $cityId] = makeProvinceAndCity();

    $this->actingAs($customer)
        ->postJson('/api/v1/addresses', addressPayload($provinceId, $cityId))
        ->assertStatus(201);

    expect(Address::where('user_id', $customer->id)->count())->toBe(1);
});

it('first address automatically becomes the default', function (): void {
    $customer            = User::factory()->customer()->create();
    [$provinceId, $cityId] = makeProvinceAndCity();

    $this->actingAs($customer)
        ->postJson('/api/v1/addresses', addressPayload($provinceId, $cityId))
        ->assertStatus(201);

    expect(Address::where('user_id', $customer->id)->first()->is_default)->toBeTrue();
});

it('second address does not become default when is_default is not set', function (): void {
    $customer = User::factory()->customer()->create();
    makeCustomerAddress($customer, ['is_default' => true]);

    [$provinceId, $cityId] = makeProvinceAndCity();

    $this->actingAs($customer)
        ->postJson('/api/v1/addresses', addressPayload($provinceId, $cityId))
        ->assertStatus(201);

    expect(Address::where('user_id', $customer->id)->where('is_default', true)->count())->toBe(1);
});

it('new address with is_default=true clears the previous default', function (): void {
    $customer = User::factory()->customer()->create();
    makeCustomerAddress($customer, ['is_default' => true]);

    [$provinceId, $cityId] = makeProvinceAndCity();

    $this->actingAs($customer)
        ->postJson('/api/v1/addresses', addressPayload($provinceId, $cityId, ['is_default' => true]))
        ->assertStatus(201);

    expect(Address::where('user_id', $customer->id)->where('is_default', true)->count())->toBe(1);
});

it('returns 422 when recipient_name is missing', function (): void {
    $customer            = User::factory()->customer()->create();
    [$provinceId, $cityId] = makeProvinceAndCity();

    $this->actingAs($customer)
        ->postJson('/api/v1/addresses', addressPayload($provinceId, $cityId, ['recipient_name' => null]))
        ->assertStatus(422);
});

it('returns 422 when recipient_phone does not match Iranian format', function (): void {
    $customer            = User::factory()->customer()->create();
    [$provinceId, $cityId] = makeProvinceAndCity();

    $this->actingAs($customer)
        ->postJson('/api/v1/addresses', addressPayload($provinceId, $cityId, ['recipient_phone' => '021-1234']))
        ->assertStatus(422);
});

it('returns 422 when city_id does not belong to the provided province_id', function (): void {
    $customer = User::factory()->customer()->create();
    [, $cityId] = makeProvinceAndCity();
    [$otherProvinceId] = makeProvinceAndCity();

    $payload = addressPayload($otherProvinceId, $cityId); // city from a different province

    $this->actingAs($customer)
        ->postJson('/api/v1/addresses', $payload)
        ->assertStatus(422)
        ->assertJsonPath('errors.city_id.0', 'شهر انتخابی مربوط به استان انتخابی نیست.');
});

// ---------------------------------------------------------------------------
// show
// ---------------------------------------------------------------------------

it('returns the address for its owner', function (): void {
    $customer = User::factory()->customer()->create();
    $address  = makeCustomerAddress($customer);

    $this->actingAs($customer)
        ->getJson("/api/v1/addresses/{$address->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $address->id);
});

it('IDOR: returns 403 when customer requests another customers address', function (): void {
    $owner   = User::factory()->customer()->create();
    $other   = User::factory()->customer()->create();
    $address = makeCustomerAddress($owner);

    $this->actingAs($other)
        ->getJson("/api/v1/addresses/{$address->id}")
        ->assertStatus(403);
});

it('returns 404 for a non-existent address', function (): void {
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)
        ->getJson('/api/v1/addresses/non-existent-id')
        ->assertStatus(404);
});

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------

it('updates own address successfully', function (): void {
    $customer = User::factory()->customer()->create();
    $address  = makeCustomerAddress($customer);

    $this->actingAs($customer)
        ->putJson("/api/v1/addresses/{$address->id}", [
            'recipient_name' => 'نام جدید',
        ])
        ->assertOk()
        ->assertJsonPath('data.recipient_name', 'نام جدید');
});

it('IDOR: returns 403 when customer updates another customers address', function (): void {
    $owner   = User::factory()->customer()->create();
    $other   = User::factory()->customer()->create();
    $address = makeCustomerAddress($owner);

    $this->actingAs($other)
        ->putJson("/api/v1/addresses/{$address->id}", ['recipient_name' => 'هکر'])
        ->assertStatus(403);

    expect($address->fresh()->recipient_name)->not->toBe('هکر');
});

it('setting is_default=true via update clears other defaults', function (): void {
    $customer  = User::factory()->customer()->create();
    $default   = makeCustomerAddress($customer, ['is_default' => true]);
    $other     = makeCustomerAddress($customer, ['is_default' => false]);

    $this->actingAs($customer)
        ->putJson("/api/v1/addresses/{$other->id}", ['is_default' => true])
        ->assertOk();

    expect($default->fresh()->is_default)->toBeFalse()
        ->and($other->fresh()->is_default)->toBeTrue();
});

it('returns 422 when city_id does not match province_id on update', function (): void {
    $customer = User::factory()->customer()->create();
    $address  = makeCustomerAddress($customer);
    [$otherProvince, $otherCity] = makeProvinceAndCity();

    // Send city from province A but province from province B
    $this->actingAs($customer)
        ->putJson("/api/v1/addresses/{$address->id}", [
            'province_id' => $otherProvince,
            'city_id'     => $address->city_id, // original city, wrong province
        ])
        ->assertStatus(422);
});

// ---------------------------------------------------------------------------
// destroy
// ---------------------------------------------------------------------------

it('deletes own address', function (): void {
    $customer = User::factory()->customer()->create();
    $address  = makeCustomerAddress($customer);

    $this->actingAs($customer)
        ->deleteJson("/api/v1/addresses/{$address->id}")
        ->assertStatus(204);

    expect(Address::find($address->id))->toBeNull();
});

it('IDOR: returns 403 when deleting another customers address', function (): void {
    $owner   = User::factory()->customer()->create();
    $other   = User::factory()->customer()->create();
    $address = makeCustomerAddress($owner);

    $this->actingAs($other)
        ->deleteJson("/api/v1/addresses/{$address->id}")
        ->assertStatus(403);

    expect(Address::find($address->id))->not->toBeNull();
});

it('deleting the default address promotes the oldest remaining address as default', function (): void {
    $customer = User::factory()->customer()->create();
    $default  = makeCustomerAddress($customer, ['is_default' => true]);
    $oldest   = makeCustomerAddress($customer, ['is_default' => false]);
    $newest   = makeCustomerAddress($customer, ['is_default' => false]);

    $this->actingAs($customer)
        ->deleteJson("/api/v1/addresses/{$default->id}")
        ->assertStatus(204);

    // oldest remaining should become default
    expect($oldest->fresh()->is_default)->toBeTrue()
        ->and($newest->fresh()->is_default)->toBeFalse();
});

it('deleting a non-default address does not change the default', function (): void {
    $customer   = User::factory()->customer()->create();
    $default    = makeCustomerAddress($customer, ['is_default' => true]);
    $nonDefault = makeCustomerAddress($customer, ['is_default' => false]);

    $this->actingAs($customer)
        ->deleteJson("/api/v1/addresses/{$nonDefault->id}")
        ->assertStatus(204);

    expect($default->fresh()->is_default)->toBeTrue();
});

// ---------------------------------------------------------------------------
// setDefault
// ---------------------------------------------------------------------------

it('sets an address as default and clears others', function (): void {
    $customer = User::factory()->customer()->create();
    $current  = makeCustomerAddress($customer, ['is_default' => true]);
    $target   = makeCustomerAddress($customer, ['is_default' => false]);

    $this->actingAs($customer)
        ->postJson("/api/v1/addresses/{$target->id}/default")
        ->assertOk();

    expect($target->fresh()->is_default)->toBeTrue()
        ->and($current->fresh()->is_default)->toBeFalse();
});

it('IDOR: returns 403 when setting another customers address as default', function (): void {
    $owner  = User::factory()->customer()->create();
    $other  = User::factory()->customer()->create();
    $target = makeCustomerAddress($owner, ['is_default' => false]);

    $this->actingAs($other)
        ->postJson("/api/v1/addresses/{$target->id}/default")
        ->assertStatus(403);

    expect($target->fresh()->is_default)->toBeFalse();
});

it('setDefault is idempotent — calling it on an already-default address is safe', function (): void {
    $customer = User::factory()->customer()->create();
    $address  = makeCustomerAddress($customer, ['is_default' => true]);

    $this->actingAs($customer)
        ->postJson("/api/v1/addresses/{$address->id}/default")
        ->assertOk();

    expect(Address::where('user_id', $customer->id)->where('is_default', true)->count())->toBe(1);
});
