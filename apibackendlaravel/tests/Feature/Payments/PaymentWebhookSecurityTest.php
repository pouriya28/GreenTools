<?php

use App\Contracts\PaymentGatewayInterface;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ReservationStatus;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Services\Payments\PaymentGatewayFactory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Wires a mock PaymentGatewayFactory into the container and returns the
 * mock gateway so individual tests can override its behaviour.
 *
 * Default behaviour:
 *   verifyCallback  → true  (valid signature)
 *   extractTransactionId → 'txn_test_001'
 *   wasSuccessful   → true  (payment succeeded)
 */
function mockGateway(
    string $slug = 'test_gw',
    bool   $verifies = true,
    bool   $succeeds = true,
    ?string $transactionId = 'txn_test_001',
): \Mockery\MockInterface {
    $gateway = \Mockery::mock(PaymentGatewayInterface::class);
    $gateway->shouldReceive('verifyCallback')->andReturn($verifies);
    $gateway->shouldReceive('extractTransactionId')->andReturn($transactionId);
    $gateway->shouldReceive('wasSuccessful')->andReturn($succeeds);
    $gateway->shouldReceive('createPaymentIntent')->andReturn('https://pay.example.com/intent');

    $factory = \Mockery::mock(PaymentGatewayFactory::class);
    $factory->shouldReceive('make')->with($slug)->andReturn($gateway);
    app()->instance(PaymentGatewayFactory::class, $factory);

    return $gateway;
}

/**
 * Builds a minimal Order + Payment pair in the DB.
 * Returns [$order, $payment].
 */
function makeOrderWithPayment(
    string $gatewaySlug = 'test_gw',
    OrderStatus $orderStatus = OrderStatus::PendingPayment,
    PaymentStatus $paymentStatus = PaymentStatus::Pending,
): array {
    $order = Order::factory()->create(['status' => $orderStatus]);

    $payment = Payment::factory()->create([
        'order_id' => $order->id,
        'gateway'  => $gatewaySlug,
        'status'   => $paymentStatus,
        'amount'   => 500_000,
    ]);

    return [$order, $payment];
}

/**
 * Sends a POST to /api/v1/payments/webhook/{gateway} with the given body.
 */
function postWebhook(
    object $testCase,
    string $gateway,
    array  $body,
    array  $headers = [],
): \Illuminate\Testing\TestResponse {
    return $testCase->withHeaders(array_merge(
        ['Accept' => 'application/json'],
        $headers,
    ))->postJson("/api/v1/payments/webhook/{$gateway}", $body);
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(function (): void {
    Http::preventStrayRequests();
    Event::fake([\App\Events\OrderPlaced::class]);
});

// ---------------------------------------------------------------------------
// Unknown gateway
// ---------------------------------------------------------------------------

it('returns 404 for an unknown gateway slug', function (): void {
    $factory = \Mockery::mock(PaymentGatewayFactory::class);
    $factory->shouldReceive('make')
        ->with('unknown_gw')
        ->andThrow(new \InvalidArgumentException('Unknown gateway'));
    app()->instance(PaymentGatewayFactory::class, $factory);

    postWebhook($this, 'unknown_gw', ['foo' => 'bar'])
        ->assertStatus(404);
});

// ---------------------------------------------------------------------------
// Signature verification — fail closed
// ---------------------------------------------------------------------------

it('returns 401 and makes no DB changes when signature is invalid', function (): void {
    mockGateway(verifies: false);
    [$order, $payment] = makeOrderWithPayment();

    postWebhook($this, 'test_gw', ['payment_id' => $payment->id, 'status' => 'paid'])
        ->assertStatus(401);

    expect($order->fresh()->status)->toBe(OrderStatus::PendingPayment)
        ->and($payment->fresh()->status)->toBe(PaymentStatus::Pending);
});

it('never dispatches OrderPlaced when signature verification fails', function (): void {
    mockGateway(verifies: false);
    [$order, $payment] = makeOrderWithPayment();

    postWebhook($this, 'test_gw', ['payment_id' => $payment->id]);

    Event::assertNotDispatched(\App\Events\OrderPlaced::class);
});

// ---------------------------------------------------------------------------
// Missing / unresolvable transaction ID
// ---------------------------------------------------------------------------

it('returns 400 when extractTransactionId returns null', function (): void {
    mockGateway(transactionId: null);
    [$order, $payment] = makeOrderWithPayment();

    postWebhook($this, 'test_gw', ['payment_id' => $payment->id])
        ->assertStatus(400);
});

// ---------------------------------------------------------------------------
// Successful payment
// ---------------------------------------------------------------------------

it('marks the payment as Paid on a valid successful callback', function (): void {
    mockGateway();
    [$order, $payment] = makeOrderWithPayment();

    postWebhook($this, 'test_gw', [
        'payment_id'     => $payment->id,
        'transaction_id' => 'txn_test_001',
    ])->assertStatus(200);

    expect($payment->fresh()->status)->toBe(PaymentStatus::Paid);
});

it('marks the order as Paid on a valid successful callback', function (): void {
    mockGateway();
    [$order, $payment] = makeOrderWithPayment();

    postWebhook($this, 'test_gw', [
        'payment_id'     => $payment->id,
        'transaction_id' => 'txn_test_001',
    ])->assertStatus(200);

    expect($order->fresh()->status)->toBe(OrderStatus::Paid);
});

it('saves the transaction_id on the payment record after success', function (): void {
    mockGateway(transactionId: 'txn_abc_999');
    [$order, $payment] = makeOrderWithPayment();

    postWebhook($this, 'test_gw', [
        'payment_id'     => $payment->id,
        'transaction_id' => 'txn_abc_999',
    ])->assertStatus(200);

    expect($payment->fresh()->transaction_id)->toBe('txn_abc_999');
});

it('confirms active reservations after successful payment', function (): void {
    mockGateway();
    [$order, $payment] = makeOrderWithPayment();

    InventoryReservation::factory()->create([
        'order_id' => $order->id,
        'status'   => ReservationStatus::Active,
    ]);

    postWebhook($this, 'test_gw', [
        'payment_id'     => $payment->id,
        'transaction_id' => 'txn_test_001',
    ])->assertStatus(200);

    expect(
        InventoryReservation::where('order_id', $order->id)->first()->status
    )->toBe(ReservationStatus::Confirmed);
});

it('decrements product stock_quantity after successful payment', function (): void {
    mockGateway();
    [$order, $payment] = makeOrderWithPayment();

    $product = Product::factory()->create(['stock_quantity' => 10, 'is_active' => true]);

    InventoryReservation::factory()->create([
        'order_id'   => $order->id,
        'product_id' => $product->id,
        'quantity'   => 3,
        'status'     => ReservationStatus::Active,
    ]);

    postWebhook($this, 'test_gw', [
        'payment_id'     => $payment->id,
        'transaction_id' => 'txn_test_001',
    ])->assertStatus(200);

    expect($product->fresh()->stock_quantity)->toBe(7);
});

it('dispatches OrderPlaced event after successful payment', function (): void {
    mockGateway();
    [$order, $payment] = makeOrderWithPayment();

    postWebhook($this, 'test_gw', [
        'payment_id'     => $payment->id,
        'transaction_id' => 'txn_test_001',
    ])->assertStatus(200);

    Event::assertDispatched(\App\Events\OrderPlaced::class,
        fn ($event) => $event->order->id === $order->id
    );
});

// ---------------------------------------------------------------------------
// Failed payment
// ---------------------------------------------------------------------------

it('marks the payment as Failed when gateway reports failure', function (): void {
    mockGateway(succeeds: false);
    [$order, $payment] = makeOrderWithPayment();

    postWebhook($this, 'test_gw', ['payment_id' => $payment->id])
        ->assertStatus(200);

    expect($payment->fresh()->status)->toBe(PaymentStatus::Failed);
});

it('releases reservations (marks expired) when payment fails', function (): void {
    mockGateway(succeeds: false);
    [$order, $payment] = makeOrderWithPayment();

    InventoryReservation::factory()->create([
        'order_id' => $order->id,
        'status'   => ReservationStatus::Active,
    ]);

    postWebhook($this, 'test_gw', ['payment_id' => $payment->id])
        ->assertStatus(200);

    expect(
        InventoryReservation::where('order_id', $order->id)->first()->status
    )->toBe(ReservationStatus::Expired);
});

it('does not decrement stock when payment fails', function (): void {
    mockGateway(succeeds: false);
    [$order, $payment] = makeOrderWithPayment();

    $product = Product::factory()->create(['stock_quantity' => 10, 'is_active' => true]);

    InventoryReservation::factory()->create([
        'order_id'   => $order->id,
        'product_id' => $product->id,
        'quantity'   => 3,
        'status'     => ReservationStatus::Active,
    ]);

    postWebhook($this, 'test_gw', ['payment_id' => $payment->id])
        ->assertStatus(200);

    expect($product->fresh()->stock_quantity)->toBe(10);
});

it('does not dispatch OrderPlaced when payment fails', function (): void {
    mockGateway(succeeds: false);
    [$order, $payment] = makeOrderWithPayment();

    postWebhook($this, 'test_gw', ['payment_id' => $payment->id])
        ->assertStatus(200);

    Event::assertNotDispatched(\App\Events\OrderPlaced::class);
});

// ---------------------------------------------------------------------------
// Idempotency — duplicate callbacks
// ---------------------------------------------------------------------------

it('is idempotent: a duplicate successful callback returns 200 without re-processing', function (): void {
    mockGateway();
    [$order, $payment] = makeOrderWithPayment();

    $product = Product::factory()->create(['stock_quantity' => 10, 'is_active' => true]);
    InventoryReservation::factory()->create([
        'order_id'   => $order->id,
        'product_id' => $product->id,
        'quantity'   => 2,
        'status'     => ReservationStatus::Active,
    ]);

    $body = ['payment_id' => $payment->id, 'transaction_id' => 'txn_test_001'];

    postWebhook($this, 'test_gw', $body)->assertStatus(200);
    postWebhook($this, 'test_gw', $body)->assertStatus(200);

    // Stock must be decremented exactly once, not twice.
    expect($product->fresh()->stock_quantity)->toBe(8);
});

it('second callback does not change payment status away from Paid', function (): void {
    mockGateway();
    [$order, $payment] = makeOrderWithPayment();

    $body = ['payment_id' => $payment->id, 'transaction_id' => 'txn_test_001'];

    postWebhook($this, 'test_gw', $body)->assertStatus(200);
    postWebhook($this, 'test_gw', $body)->assertStatus(200);

    expect($payment->fresh()->status)->toBe(PaymentStatus::Paid);
});

// ---------------------------------------------------------------------------
// Gateway mismatch (cross-gateway fraud attempt)
// ---------------------------------------------------------------------------

it('ignores a callback routed through the wrong gateway slug', function (): void {
    // Payment was created under 'gateway_a' but the webhook arrives via 'gateway_b'.
    // The controller must detect the mismatch and silently ignore the callback
    // (returns 200 to avoid leaking internal info but makes no state changes).
    [$order, $payment] = makeOrderWithPayment(gatewaySlug: 'gateway_a');

    $gatewayB = \Mockery::mock(PaymentGatewayInterface::class);
    $gatewayB->shouldReceive('verifyCallback')->andReturn(true);
    $gatewayB->shouldReceive('extractTransactionId')->andReturn('txn_fraud_001');
    $gatewayB->shouldReceive('wasSuccessful')->andReturn(true);

    $factory = \Mockery::mock(PaymentGatewayFactory::class);
    $factory->shouldReceive('make')->with('gateway_b')->andReturn($gatewayB);
    app()->instance(PaymentGatewayFactory::class, $factory);

    postWebhook($this, 'gateway_b', ['payment_id' => $payment->id])
        ->assertStatus(200);

    expect($order->fresh()->status)->toBe(OrderStatus::PendingPayment)
        ->and($payment->fresh()->status)->toBe(PaymentStatus::Pending);
});
