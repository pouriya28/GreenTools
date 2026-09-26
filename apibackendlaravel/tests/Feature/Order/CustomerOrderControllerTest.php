<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Http;

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(function (): void {
    Http::preventStrayRequests();
});

// ---------------------------------------------------------------------------
// index — scoped to authenticated user
// ---------------------------------------------------------------------------

it('returns only the authenticated customer orders', function (): void {
    $customer = User::factory()->customer()->create();
    $other    = User::factory()->customer()->create();

    Order::factory()->count(3)->create(['user_id' => $customer->id]);
    Order::factory()->count(2)->create(['user_id' => $other->id]);

    $this->actingAs($customer)
        ->getJson('/api/v1/orders')
        ->assertOk()
        ->assertJsonCount(3, 'data.data');
});

it('returns 200 with empty list when customer has no orders', function (): void {
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)
        ->getJson('/api/v1/orders')
        ->assertOk()
        ->assertJsonCount(0, 'data.data');
});

it('returns 401 for unauthenticated requests', function (): void {
    $this->getJson('/api/v1/orders')->assertStatus(401);
});

it('returns 403 when a staff account hits the customer orders endpoint', function (): void {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->getJson('/api/v1/orders')
        ->assertStatus(403);
});

it('paginates results according to per_page parameter', function (): void {
    $customer = User::factory()->customer()->create();
    Order::factory()->count(10)->create(['user_id' => $customer->id]);

    $this->actingAs($customer)
        ->getJson('/api/v1/orders?per_page=3')
        ->assertOk()
        ->assertJsonCount(3, 'data.data')
        ->assertJsonPath('data.meta.per_page', 3);
});

it('returns 422 when per_page exceeds the maximum of 50', function (): void {
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)
        ->getJson('/api/v1/orders?per_page=100')
        ->assertStatus(422);
});

// ---------------------------------------------------------------------------
// show — IDOR guard
// ---------------------------------------------------------------------------

it('returns the order details for the owner', function (): void {
    $customer = User::factory()->customer()->create();
    $order    = Order::factory()->create(['user_id' => $customer->id]);

    $this->actingAs($customer)
        ->getJson("/api/v1/orders/{$order->id}")
        ->assertOk()
        ->assertJsonPath('data.data.id', $order->id);
});

it('IDOR: returns 404 when a customer requests another customers order', function (): void {
    // CRITICAL: must return 404, not 403, so the existence of the order
    // cannot be inferred from the response code.
    $owner   = User::factory()->customer()->create();
    $other   = User::factory()->customer()->create();
    $order   = Order::factory()->create(['user_id' => $owner->id]);

    $this->actingAs($other)
        ->getJson("/api/v1/orders/{$order->id}")
        ->assertStatus(404);
});

it('returns 404 for a non-existent order ID', function (): void {
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)
        ->getJson('/api/v1/orders/non-existent-ulid')
        ->assertStatus(404);
});

it('returns 401 when show is called without authentication', function (): void {
    $order = Order::factory()->create();

    $this->getJson("/api/v1/orders/{$order->id}")
        ->assertStatus(401);
});

it('IDOR: staff cannot access customer orders via the customer endpoint', function (): void {
    $staff = User::factory()->staff()->create();
    $order = Order::factory()->create();

    $this->actingAs($staff)
        ->getJson("/api/v1/orders/{$order->id}")
        ->assertStatus(403);
});
