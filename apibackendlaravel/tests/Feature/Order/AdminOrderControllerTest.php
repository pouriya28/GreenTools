<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Http;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAdminWithOrderPermissions(string ...$permissions): User
{
    $admin = User::factory()->staff()->create();
    foreach ($permissions as $permission) {
        \Spatie\Permission\Models\Permission::firstOrCreate([
            'name'       => $permission,
            'guard_name' => 'sanctum',
        ]);
        $admin->givePermissionTo($permission);
    }
    return $admin;
}

function makeStaffWithoutOrderPermission(): User
{
    return User::factory()->staff()->create();
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

it('admin can list all orders with orders.view permission', function (): void {
    $admin = makeAdminWithOrderPermissions('orders.view');
    Order::factory()->count(5)->create();

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/orders')
        ->assertOk()
        ->assertJsonStructure(['data' => ['data']]);
});

it('index returns 403 for staff without orders.view permission', function (): void {
    $staff = makeStaffWithoutOrderPermission();

    $this->actingAs($staff)
        ->getJson('/api/v1/admin/orders')
        ->assertStatus(403);
});

it('index returns 401 for unauthenticated requests', function (): void {
    $this->getJson('/api/v1/admin/orders')->assertStatus(401);
});

it('index returns 403 for a customer account', function (): void {
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)
        ->getJson('/api/v1/admin/orders')
        ->assertStatus(403);
});

it('index filters by status', function (): void {
    $admin = makeAdminWithOrderPermissions('orders.view');
    Order::factory()->count(3)->create(['status' => OrderStatus::PendingPayment]);
    Order::factory()->count(2)->create(['status' => OrderStatus::Paid]);

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/orders?status=pending_payment')
        ->assertOk()
        ->assertJsonCount(3, 'data.data');
});

// ---------------------------------------------------------------------------
// show
// ---------------------------------------------------------------------------

it('admin can view any order with orders.view permission', function (): void {
    $admin    = makeAdminWithOrderPermissions('orders.view');
    $customer = User::factory()->customer()->create();
    $order    = Order::factory()->create(['user_id' => $customer->id]);

    $this->actingAs($admin)
        ->getJson("/api/v1/admin/orders/{$order->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $order->id);
});

it('show returns 403 for staff without orders.view', function (): void {
    $staff = makeStaffWithoutOrderPermission();
    $order = Order::factory()->create();

    $this->actingAs($staff)
        ->getJson("/api/v1/admin/orders/{$order->id}")
        ->assertStatus(403);
});

it('show returns 404 for a non-existent order', function (): void {
    $admin = makeAdminWithOrderPermissions('orders.view');

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/orders/non-existent-id')
        ->assertStatus(404);
});

// ---------------------------------------------------------------------------
// updateStatus — state machine
// ---------------------------------------------------------------------------

it('admin can transition order from PendingPayment to Paid', function (): void {
    $admin = makeAdminWithOrderPermissions('orders.view', 'orders.update');
    $order = Order::factory()->create(['status' => OrderStatus::PendingPayment]);

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/orders/{$order->id}/status", [
            'status' => 'paid',
        ])
        ->assertOk();

    expect($order->fresh()->status)->toBe(OrderStatus::Paid);
});

it('admin can transition order from PendingPayment to Cancelled', function (): void {
    $admin = makeAdminWithOrderPermissions('orders.view', 'orders.update');
    $order = Order::factory()->create(['status' => OrderStatus::PendingPayment]);

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/orders/{$order->id}/status", [
            'status' => 'cancelled',
        ])
        ->assertOk();

    expect($order->fresh()->status)->toBe(OrderStatus::Cancelled);
});

it('admin can transition through the full happy path: Paid → Processing → Packed → Shipped → Delivered', function (): void {
    $admin = makeAdminWithOrderPermissions('orders.view', 'orders.update');
    $order = Order::factory()->create(['status' => OrderStatus::Paid]);

    $transitions = [
        ['status' => 'processing'],
        ['status' => 'packed'],
        ['status' => 'shipped', 'tracking_code' => 'TRACK-001'],
        ['status' => 'delivered'],
    ];

    foreach ($transitions as $payload) {
        $this->actingAs($admin)
            ->patchJson("/api/v1/admin/orders/{$order->id}/status", $payload)
            ->assertOk();
        $order->refresh();
    }

    expect($order->status)->toBe(OrderStatus::Delivered);
});

it('returns 409 for an illegal status transition', function (): void {
    $admin = makeAdminWithOrderPermissions('orders.view', 'orders.update');
    $order = Order::factory()->create(['status' => OrderStatus::PendingPayment]);

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/orders/{$order->id}/status", [
            'status' => 'delivered', // illegal jump
        ])
        ->assertStatus(409);

    expect($order->fresh()->status)->toBe(OrderStatus::PendingPayment);
});

it('returns 409 when trying to transition a Delivered order', function (): void {
    $admin = makeAdminWithOrderPermissions('orders.view', 'orders.update');
    $order = Order::factory()->create(['status' => OrderStatus::Delivered]);

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/orders/{$order->id}/status", [
            'status' => 'cancelled',
        ])
        ->assertStatus(409);
});

it('returns 409 when trying to transition a Cancelled order', function (): void {
    $admin = makeAdminWithOrderPermissions('orders.view', 'orders.update');
    $order = Order::factory()->create(['status' => OrderStatus::Cancelled]);

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/orders/{$order->id}/status", [
            'status' => 'paid',
        ])
        ->assertStatus(409);
});

it('updateStatus returns 403 for staff without orders.update permission', function (): void {
    $staff = makeStaffWithoutOrderPermission();
    $order = Order::factory()->create(['status' => OrderStatus::PendingPayment]);

    $this->actingAs($staff)
        ->patchJson("/api/v1/admin/orders/{$order->id}/status", [
            'status' => 'paid',
        ])
        ->assertStatus(403);
});

it('updateStatus creates a Shipment record when transitioning to Shipped', function (): void {
    $admin = makeAdminWithOrderPermissions('orders.view', 'orders.update');
    $order = Order::factory()->create(['status' => OrderStatus::Packed]);

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/orders/{$order->id}/status", [
            'status'        => 'shipped',
            'tracking_code' => 'TRK-12345',
        ])
        ->assertOk();

    expect(\App\Models\Shipment::where('order_id', $order->id)->exists())->toBeTrue()
        ->and(\App\Models\Shipment::where('order_id', $order->id)->first()->tracking_code)
        ->toBe('TRK-12345');
});

it('updateStatus sets delivered_at on the Shipment when transitioning to Delivered', function (): void {
    $admin = makeAdminWithOrderPermissions('orders.view', 'orders.update');
    $order = Order::factory()->create(['status' => OrderStatus::Shipped]);

    // Create the shipment record that would have been created on Shipped transition
    \App\Models\Shipment::create([
        'order_id'      => $order->id,
        'status'        => 'shipped',
        'tracking_code' => 'TRK-999',
        'shipped_at'    => now()->subDay(),
    ]);

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/orders/{$order->id}/status", [
            'status' => 'delivered',
        ])
        ->assertOk();

    $shipment = \App\Models\Shipment::where('order_id', $order->id)->first();
    expect($shipment->delivered_at)->not->toBeNull();
});

it('updateStatus returns 422 for an unrecognized status value', function (): void {
    $admin = makeAdminWithOrderPermissions('orders.view', 'orders.update');
    $order = Order::factory()->create(['status' => OrderStatus::PendingPayment]);

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/orders/{$order->id}/status", [
            'status' => 'refunded', // not in enum
        ])
        ->assertStatus(422);
});
