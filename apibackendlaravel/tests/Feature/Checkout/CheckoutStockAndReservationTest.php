<?php

use App\Contracts\PaymentGatewayInterface;
use App\Enums\OrderStatus;
use App\Enums\ReservationStatus;
use App\Jobs\ExpireInventoryReservationsJob;
use App\Models\Address;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\Product;
use App\Models\ShippingMethod;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

// ---------------------------------------------------------------------------
// Helper — minimal checkout-ready state (no CartItems added yet)
// ---------------------------------------------------------------------------

function makeStockTestState(int $stockQty = 1): array
{
    Http::preventStrayRequests();

    config(['payments.gateways.test_gateway' => ['driver' => 'test']]);

    $user    = User::factory()->customer()->create();
    $product = Product::factory()->create([
        'is_active'      => true,
        'stock_quantity' => $stockQty,
    ]);
    DB::table('products')
        ->where('id', $product->id)
        ->update(['price_toman' => 500_000]);
    $product->refresh();

    $address        = Address::factory()->create(['user_id' => $user->id]);
    $shippingMethod = ShippingMethod::factory()->create(['is_active' => true]);
    $cart           = Cart::factory()->forUser($user)->create();

    // Mock: store is open
    $storeStatus = \Mockery::mock(\App\Services\StoreStatusService::class);
    $storeStatus->shouldReceive('isOpen')->andReturn(true);
    app()->instance(\App\Services\StoreStatusService::class, $storeStatus);

    // Mock: payment gateway
    $gateway = \Mockery::mock(PaymentGatewayInterface::class);
    $gateway->shouldReceive('createPaymentIntent')
        ->andReturn('https://pay.example.com/fake-intent');
    $gatewayFactory = \Mockery::mock(\App\Services\Payments\PaymentGatewayFactory::class);
    $gatewayFactory->shouldReceive('make')->andReturn($gateway);
    app()->instance(\App\Services\Payments\PaymentGatewayFactory::class, $gatewayFactory);

    // Mock: shipping calculator
    $shippingCalc = \Mockery::mock(\App\Contracts\ShippingCalculatorInterface::class);
    $shippingCalc->shouldReceive('calculate')
        ->andReturn(new \App\Services\Shipping\ShippingQuote(
                    shippingMethodId: $state['shippingMethod']->id ?? 'test',
                    methodName:       'Standard',
                    calculationType:  'fixed',
                    cost:             50_000,
                    estimatedDaysMin: 2,
                    estimatedDaysMax: 5,
                    isFreeShipping:   false,
                ));
    app()->instance(\App\Contracts\ShippingCalculatorInterface::class, $shippingCalc);

    return compact('user', 'product', 'address', 'shippingMethod', 'cart');
}

function stockPayload(array $state): array
{
    return [
        'address_id'         => $state['address']['id'],
        'shipping_method_id' => $state['shippingMethod']['id'],
        'gateway'            => 'test_gateway',
    ];
}

/**
 * Creates a PendingPayment order directly via CheckoutService so it gets a
 * proper idempotency_key, Payment row, and InventoryReservation — just like
 * a real checkout. Order::factory() is intentionally not used because Order
 * is fully $guarded and HasFactory is not in the model.
 */
function createOrderViaCheckout(array $state): Order
{
    CartItem::factory()->create([
        'cart_id'    => $state['cart']->id,
        'product_id' => $state['product']->id,
        'quantity'   => 1,
    ]);

    /** @var \Tests\TestCase $testCase */
    

    $result = app(\App\Services\Checkout\CheckoutService::class)->checkout(
        $state['cart'],
        $state['address'],
        $state['shippingMethod']->id,
        'test_gateway',
    );

    return $result->order;
}

// ---------------------------------------------------------------------------
// Stock reservation — checkout blocked
// ---------------------------------------------------------------------------

it('rejects checkout when active reservations consume all available stock', function (): void {
    $state = makeStockTestState(stockQty: 1);

    CartItem::factory()->create([
        'cart_id'    => $state['cart']->id,
        'product_id' => $state['product']->id,
        'quantity'   => 1,
    ]);

    // Another order already holds the only unit in an active reservation.
    InventoryReservation::factory()->create([
        'product_id' => $state['product']->id,
        'quantity'   => 1,
        'status'     => ReservationStatus::Active,
        'expires_at' => now()->addMinutes(30),
    ]);

    $this->actingAs($state['user'])
        ->postJson('/api/v1/checkout', stockPayload($state))
        ->assertStatus(422);
});

it('allows checkout when existing reservations are confirmed (stock already deducted)', function (): void {
    $state = makeStockTestState(stockQty: 1);

    CartItem::factory()->create([
        'cart_id'    => $state['cart']->id,
        'product_id' => $state['product']->id,
        'quantity'   => 1,
    ]);

    // Confirmed reservation: stock was already counted down → doesn't block new checkout.
    InventoryReservation::factory()->confirmed()->create([
        'product_id' => $state['product']->id,
        'quantity'   => 1,
    ]);

    $this->actingAs($state['user'])
        ->postJson('/api/v1/checkout', stockPayload($state))
        ->assertCreated();
});

it('allows checkout when existing reservations are expired', function (): void {
    $state = makeStockTestState(stockQty: 1);

    CartItem::factory()->create([
        'cart_id'    => $state['cart']->id,
        'product_id' => $state['product']->id,
        'quantity'   => 1,
    ]);

    // Expired reservation: stock is released → the unit is available again.
    InventoryReservation::factory()->expired()->create([
        'product_id' => $state['product']->id,
        'quantity'   => 1,
    ]);

    $this->actingAs($state['user'])
        ->postJson('/api/v1/checkout', stockPayload($state))
        ->assertCreated();
});

it('creates an active InventoryReservation for each item on successful checkout', function (): void {
    $state = makeStockTestState(stockQty: 5);

    CartItem::factory()->create([
        'cart_id'    => $state['cart']->id,
        'product_id' => $state['product']->id,
        'quantity'   => 2,
    ]);

    $this->actingAs($state['user'])
        ->postJson('/api/v1/checkout', stockPayload($state))
        ->assertCreated();

    expect(
        InventoryReservation::where('product_id', $state['product']->id)
            ->where('status', ReservationStatus::Active)
            ->sum('quantity')
    )->toBe(2);
});

it('reservation expires_at is 30 minutes from checkout time', function (): void {
    $state = makeStockTestState(stockQty: 5);

    CartItem::factory()->create([
        'cart_id'    => $state['cart']->id,
        'product_id' => $state['product']->id,
        'quantity'   => 1,
    ]);

    $before = now()->addMinutes(29);
    $after  = now()->addMinutes(31);

    $this->actingAs($state['user'])
        ->postJson('/api/v1/checkout', stockPayload($state))
        ->assertCreated();

    $reservation = InventoryReservation::where('product_id', $state['product']->id)->latest('id')->first();

    expect($reservation->expires_at->between($before, $after))->toBeTrue();
});

it('rejects checkout when product is inactive', function (): void {
    $state = makeStockTestState(stockQty: 5);

    DB::table('products')
        ->where('id', $state['product']->id)
        ->update(['is_active' => false]);

    CartItem::factory()->create([
        'cart_id'    => $state['cart']->id,
        'product_id' => $state['product']->id,
        'quantity'   => 1,
    ]);

    $this->actingAs($state['user'])
        ->postJson('/api/v1/checkout', stockPayload($state))
        ->assertStatus(422);
});

// ---------------------------------------------------------------------------
// ExpireInventoryReservationsJob
// ---------------------------------------------------------------------------

it('cancels a PendingPayment order when its reservation expires', function (): void {
    // Build a real PendingPayment order through the normal checkout flow so
    // all FK constraints are satisfied. Order::factory() is not used because
    // Order does not use HasFactory (it is fully $guarded by design).
    $state = makeStockTestState(stockQty: 5);
    $order = createOrderViaCheckout($state);

    // Force the reservation to be past its expiry.
    DB::table('inventory_reservations')
        ->where('order_id', $order->id)
        ->update([
            'expires_at' => now()->subMinute(),
            'status'     => ReservationStatus::Active->value,
        ]);

    (new ExpireInventoryReservationsJob())->handle();

    expect($order->refresh()->status)->toBe(OrderStatus::Cancelled);
});

it('marks the reservation as expired after the job runs', function (): void {
    $state = makeStockTestState(stockQty: 5);
    $order = createOrderViaCheckout($state);

    DB::table('inventory_reservations')
        ->where('order_id', $order->id)
        ->update([
            'expires_at' => now()->subMinute(),
            'status'     => ReservationStatus::Active->value,
        ]);

    (new ExpireInventoryReservationsJob())->handle();

    $reservation = InventoryReservation::where('order_id', $order->id)->first();
    expect($reservation->status)->toBe(ReservationStatus::Expired);
});

it('does not cancel an order whose reservation has not yet expired', function (): void {
    $state = makeStockTestState(stockQty: 5);
    $order = createOrderViaCheckout($state);

    // Reservation is still in the future — job must leave it untouched.
    DB::table('inventory_reservations')
        ->where('order_id', $order->id)
        ->update(['expires_at' => now()->addMinutes(10)]);

    (new ExpireInventoryReservationsJob())->handle();

    expect($order->refresh()->status)->toBe(OrderStatus::PendingPayment);
});

it('does not cancel an already-paid order even when reservation is past expiry', function (): void {
    // Payment completes before the job runs — the order is already Processing.
    // The job must not retroactively cancel a paid order.
    $state = makeStockTestState(stockQty: 5);
    $order = createOrderViaCheckout($state);

    DB::table('orders')
        ->where('id', $order->id)
        ->update(['status' => OrderStatus::Processing->value]);

    DB::table('inventory_reservations')
        ->where('order_id', $order->id)
        ->update([
            'expires_at' => now()->subMinute(),
            'status'     => ReservationStatus::Active->value,
        ]);

    (new ExpireInventoryReservationsJob())->handle();

    expect($order->refresh()->status)->toBe(OrderStatus::Processing);
});
