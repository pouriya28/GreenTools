<?php

use App\Contracts\PaymentGatewayInterface;
use App\Enums\OrderStatus;
use App\Models\Address;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\ShippingMethod;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Builds a fully wired checkout-ready state.
 *
 * Mocks injected into the container:
 *   - StoreStatusService   → store is open
 *   - PaymentGatewayFactory → createPaymentIntent returns a fake URL
 *   - ShippingCalculatorInterface → returns a fixed cost
 */
function makeCheckoutState(int $stockQty = 5): array
{
    Http::preventStrayRequests();

    config(['payments.gateways.test_gateway' => ['driver' => 'test']]);

    $user = User::factory()->customer()->create();

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

    CartItem::factory()->create([
        'cart_id'    => $cart->id,
        'product_id' => $product->id,
        'quantity'   => 1,
    ]);

    // Mock: store is open
    $storeStatus = \Mockery::mock(\App\Services\StoreStatusService::class);
    $storeStatus->shouldReceive('isOpen')->andReturn(true);
    app()->instance(\App\Services\StoreStatusService::class, $storeStatus);

    // Mock: payment gateway returns a fake redirect URL
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

function checkoutPayload(array $state, array $overrides = []): array
{
    return array_merge([
        'address_id'         => $state['address']['id'],
        'shipping_method_id' => $state['shippingMethod']['id'],
        'gateway'            => 'test_gateway',
    ], $overrides);
}

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

it('creates exactly one order when checkout is submitted twice with the same cart version', function (): void {
    $state   = makeCheckoutState();
    $payload = checkoutPayload($state);

    $this->actingAs($state['user'])->postJson('/api/v1/checkout', $payload)->assertCreated();
    $this->actingAs($state['user'])->postJson('/api/v1/checkout', $payload)->assertCreated();

    expect(Order::where('user_id', $state['user']->id)->count())->toBe(1);
});

it('returns the same order_id on the second idempotent submission', function (): void {
    $state   = makeCheckoutState();
    $payload = checkoutPayload($state);

    $first  = $this->actingAs($state['user'])->postJson('/api/v1/checkout', $payload);
    $second = $this->actingAs($state['user'])->postJson('/api/v1/checkout', $payload);

    expect($first->json('order_id'))->toBe($second->json('order_id'));
});

it('creates a new order when cart version changes between submissions', function (): void {
    $state   = makeCheckoutState(stockQty: 10);
    $payload = checkoutPayload($state);

    $this->actingAs($state['user'])->postJson('/api/v1/checkout', $payload)->assertCreated();

    // Bump the cart version (simulates adding/removing an item)
    DB::table('carts')->where('id', $state['cart']->id)->increment('version');



    $this->actingAs($state['user'])->postJson('/api/v1/checkout', $payload)->assertCreated();

    expect(Order::where('user_id', $state['user']->id)->count())->toBe(2);
});

it('creates a new order when the address changes between submissions', function (): void {
    $state    = makeCheckoutState(stockQty: 10);
    $address2 = Address::factory()->create(['user_id' => $state['user']->id]);

    $this->actingAs($state['user'])
        ->postJson('/api/v1/checkout', checkoutPayload($state))
        ->assertCreated();



    $this->actingAs($state['user'])
        ->postJson('/api/v1/checkout', checkoutPayload($state, ['address_id' => $address2->id]))
        ->assertCreated();

    expect(Order::where('user_id', $state['user']->id)->count())->toBe(2);
});

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------

it('returns 201 with order_id status total_amount shipping_cost and payment_url', function (): void {
    $state = makeCheckoutState();

    $this->actingAs($state['user'])
        ->postJson('/api/v1/checkout', checkoutPayload($state))
        ->assertCreated()
        ->assertJsonStructure(['order_id', 'status', 'total_amount', 'shipping_cost', 'payment_url']);
});

it('response status is pending_payment', function (): void {
    $state = makeCheckoutState();

    $this->actingAs($state['user'])
        ->postJson('/api/v1/checkout', checkoutPayload($state))
        ->assertCreated()
        ->assertJsonPath('status', OrderStatus::PendingPayment->value);
});

it('response payment_url is the URL returned by the gateway', function (): void {
    $state = makeCheckoutState();

    $this->actingAs($state['user'])
        ->postJson('/api/v1/checkout', checkoutPayload($state))
        ->assertCreated()
        ->assertJsonPath('payment_url', 'https://pay.example.com/fake-intent');
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

it('returns 422 when address_id is missing', function (): void {
    $state = makeCheckoutState();

    $this->actingAs($state['user'])
        ->postJson('/api/v1/checkout', checkoutPayload($state, ['address_id' => null]))
        ->assertStatus(422);
});

it('returns 422 when shipping_method_id is missing', function (): void {
    $state = makeCheckoutState();

    $this->actingAs($state['user'])
        ->postJson('/api/v1/checkout', checkoutPayload($state, ['shipping_method_id' => null]))
        ->assertStatus(422);
});

it('returns 422 when shipping_method_id points to an inactive method', function (): void {
    $state    = makeCheckoutState();
    $inactive = ShippingMethod::factory()->inactive()->create();

    $this->actingAs($state['user'])
        ->postJson('/api/v1/checkout', checkoutPayload($state, ['shipping_method_id' => $inactive->id]))
        ->assertStatus(422);
});

it('returns 422 when gateway is missing', function (): void {
    $state = makeCheckoutState();

    $this->actingAs($state['user'])
        ->postJson('/api/v1/checkout', checkoutPayload($state, ['gateway' => null]))
        ->assertStatus(422);
});

it('returns 422 when gateway is not a configured gateway', function (): void {
    $state = makeCheckoutState();

    $this->actingAs($state['user'])
        ->postJson('/api/v1/checkout', checkoutPayload($state, ['gateway' => 'unknown_gw']))
        ->assertStatus(422);
});

// ---------------------------------------------------------------------------
// Empty cart
// ---------------------------------------------------------------------------

it('returns 422 when the cart is empty', function (): void {
    Http::preventStrayRequests();

    config(['payments.gateways.test_gateway' => ['driver' => 'test']]);

    $user    = User::factory()->customer()->create();
    $address = Address::factory()->create(['user_id' => $user->id]);
    $method  = ShippingMethod::factory()->create(['is_active' => true]);

    Cart::factory()->forUser($user)->create(); // No items

    $storeStatus = \Mockery::mock(\App\Services\StoreStatusService::class);
    $storeStatus->shouldReceive('isOpen')->andReturn(true);
    app()->instance(\App\Services\StoreStatusService::class, $storeStatus);

    $this->actingAs($user)
        ->postJson('/api/v1/checkout', [
            'address_id'         => $address->id,
            'shipping_method_id' => $method->id,
            'gateway'            => 'test_gateway',
        ])
        ->assertStatus(422);
});

// ---------------------------------------------------------------------------
// Security
// ---------------------------------------------------------------------------

it('returns 401 when the request is unauthenticated', function (): void {
    $this->postJson('/api/v1/checkout', [
        'address_id'         => 'some-id',
        'shipping_method_id' => 'some-id',
        'gateway'            => 'test_gateway',
    ])->assertStatus(401);
});

it('returns 404 when address_id belongs to a different user (IDOR guard)', function (): void {
    $state        = makeCheckoutState();
    $otherUser    = User::factory()->customer()->create();
    $otherAddress = Address::factory()->create(['user_id' => $otherUser->id]);

    $this->actingAs($state['user'])
        ->postJson('/api/v1/checkout', checkoutPayload($state, ['address_id' => $otherAddress->id]))
        ->assertStatus(404);
});

it('returns 422 when a guest cart attempts checkout', function (): void {
    Http::preventStrayRequests();

    config(['payments.gateways.test_gateway' => ['driver' => 'test']]);

    $user    = User::factory()->customer()->create();
    $address = Address::factory()->create(['user_id' => $user->id]);
    $method  = ShippingMethod::factory()->create(['is_active' => true]);

    // A guest cart (no user_id). ResolveCart middleware would normally attach
    // this via a cookie; here we directly test that the controller guard fires.
    Cart::factory()->create([
        'user_id'     => null,
        'guest_token' => \Illuminate\Support\Str::uuid(),
    ]);

    $storeStatus = \Mockery::mock(\App\Services\StoreStatusService::class);
    $storeStatus->shouldReceive('isOpen')->andReturn(true);
    app()->instance(\App\Services\StoreStatusService::class, $storeStatus);

    $this->actingAs($user)
        ->postJson('/api/v1/checkout', [
            'address_id'         => $address->id,
            'shipping_method_id' => $method->id,
            'gateway'            => 'test_gateway',
        ])
        ->assertStatus(422);
});
