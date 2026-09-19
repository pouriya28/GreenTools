<?php

namespace App\Services\Checkout;

use App\Contracts\ShippingCalculatorInterface;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Exceptions\Cart\InsufficientStockException;
use App\Exceptions\Cart\ProductUnavailableException;
use App\Exceptions\Checkout\AddressNotOwnedException;
use App\Exceptions\Checkout\EmptyCartException;
use App\Exceptions\Checkout\PaymentGatewayUnavailableException;
use App\Exceptions\Checkout\StoreClosedException;
use App\Exceptions\Checkout\TechnicalConsultationRequiredException;
use App\Exceptions\Shipping\ShippingMethodUnavailableException;
use App\Models\Address;
use App\Models\Cart;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ShippingMethod;
use App\Models\TechnicalConsultationRequest;
use App\Services\AddressService;
use App\Services\Cart\CartService;
use App\Services\Inventory\StockAvailabilityService;
use App\Services\Payments\PaymentGatewayFactory;
use App\Services\StoreStatusService;
use Illuminate\Support\Facades\DB;

class CheckoutService
{
    private const RESERVATION_MINUTES = 30;

    public function __construct(
        private readonly StockAvailabilityService $stockAvailability,
        private readonly AddressService $addressService,
        private readonly StoreStatusService $storeStatus,
        private readonly CartService $cartService,
        private readonly ShippingCalculatorInterface $shippingCalculator,
        private readonly PaymentGatewayFactory $gatewayFactory,
    ) {
    }

    public function checkout(Cart $cart, Address $address, string $shippingMethodId, string $gatewaySlug): CheckoutResult
    {
        if (! $this->storeStatus->isOpen()) {
            throw new StoreClosedException($this->storeStatus->current()->closed_reason);
        }

        if ($address->user_id !== $cart->user_id) {
            throw new AddressNotOwnedException($address->id);
        }

        if (! array_key_exists($gatewaySlug, config('payments.gateways', []))) {
            throw new PaymentGatewayUnavailableException($gatewaySlug);
        }

        // Shipping method is part of the idempotency key too, for the same
        // reason address was added before: changing the shipping method without
        // bumping the cart version must not silently return a stale order.
        $idempotencyKey = $this->buildIdempotencyKey($cart, $address, $shippingMethodId);

        // Fast path: avoid transaction/lock overhead on the common, non-concurrent
        // duplicate-submission case.
        $existing = Order::where('idempotency_key', $idempotencyKey)->first();
        if ($existing !== null) {
            return $this->resultForOrder($existing);
        }

        $order = DB::transaction(function () use ($cart, $address, $shippingMethodId, $gatewaySlug, $idempotencyKey) {
            // Authoritative check: locked and inside the transaction, so two
            // concurrent duplicate submissions can't both pass this check and
            // both attempt to Order::create() with the same idempotency_key.
            $existing = Order::where('idempotency_key', $idempotencyKey)->lockForUpdate()->first();
            if ($existing !== null) {
                return $existing;
            }

            $cart->loadMissing('items.product');

            if ($cart->items->isEmpty()) {
                throw new EmptyCartException();
            }

            $shippingMethod = ShippingMethod::where('id', $shippingMethodId)
                ->where('is_active', true)
                ->first();

            if ($shippingMethod === null) {
                throw new ShippingMethodUnavailableException($shippingMethodId);
            }

            $productsTotal = 0;
            $lineItems = [];

            foreach ($cart->items as $cartItem) {
                $product = Product::where('id', $cartItem->product_id)
                    ->where('is_active', true)
                    ->lockForUpdate()
                    ->first();

                if ($product === null) {
                    throw new ProductUnavailableException($cartItem->product_id);
                }

                $this->assertTechnicalConsultationApprovedIfRequired($cart->user_id, $product);

                $available = $this->stockAvailability->availableStock($product);
                if ($available < $cartItem->quantity) {
                    throw new InsufficientStockException($product->id, $available);
                }

                // Recalculate authoritative price at checkout time — never trust the cart snapshot.
                $unitPrice = $product->final_price;
                $subtotal = $unitPrice * $cartItem->quantity;
                $productsTotal += $subtotal;

                $lineItems[] = [
                    'product' => $product,
                    'quantity' => $cartItem->quantity,
                    'unit_price' => $unitPrice,
                    'subtotal' => $subtotal,
                ];
            }

            // Weight/quote computed from the same locked cart items used for pricing,
            // so a race between stock-lock and shipping-quote can't happen.
            $weightGrams = $this->cartService->totalWeightGrams($cart);
            $shippingQuote = $this->shippingCalculator->calculate(
                $shippingMethod,
                $weightGrams,
                $productsTotal,
                $address,
            );

            $grandTotal = $productsTotal + $shippingQuote->cost;

            $order = Order::create([
                'user_id' => $cart->user_id,
                'cart_id' => $cart->id,
                'status' => OrderStatus::PendingPayment,
                'total_amount' => $grandTotal,
                'idempotency_key' => $idempotencyKey,
                'shipping_method_id_snapshot' => $shippingMethod->id,
                'shipping_method_name_snapshot' => $shippingMethod->name,
                'shipping_calculation_type_snapshot' => $shippingMethod->calculation_type->value,
                'shipping_cost' => $shippingQuote->cost,
            ]);

            $this->addressService->createSnapshot($order, $address);

            foreach ($lineItems as $line) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id_snapshot' => $line['product']->id,
                    'product_name' => $line['product']->name,
                    'sku' => $line['product']->sku,
                    'unit_price' => $line['unit_price'],
                    'quantity' => $line['quantity'],
                    'subtotal' => $line['subtotal'],
                ]);

                InventoryReservation::create([
                    'order_id' => $order->id,
                    'product_id' => $line['product']->id,
                    'quantity' => $line['quantity'],
                    'status' => 'active',
                    'expires_at' => now()->addMinutes(self::RESERVATION_MINUTES),
                ]);
            }

            Payment::create([
                'order_id' => $order->id,
                'gateway' => $gatewaySlug,
                'amount' => $grandTotal,
                'status' => PaymentStatus::Pending,
            ]);

            return $order;
        });

        return $this->resultForOrder($order);
    }

    /**
     * Builds the redirect result for a checkout call, whether the order was
     * just created or this is a duplicate submission returning the existing one.
     */
    private function resultForOrder(Order $order): CheckoutResult
    {
        $payment = Payment::where('order_id', $order->id)->latest('id')->first();

        if ($payment === null) {
            throw new \RuntimeException("Order {$order->id} has no associated payment.");
        }

        $gatewayImpl = $this->gatewayFactory->make($payment->gateway);
        $paymentIntentUrl = $gatewayImpl->createPaymentIntent($payment);

        return new CheckoutResult($order, $paymentIntentUrl);
    }

    private function assertTechnicalConsultationApprovedIfRequired(string $userId, Product $product): void
    {
        if (! $product->purchase_confirmation_required) {
            return;
        }

        $approved = TechnicalConsultationRequest::where('user_id', $userId)
            ->where('product_id', $product->id)
            ->where('status', 'approved')
            ->exists();

        if (! $approved) {
            throw new TechnicalConsultationRequiredException($product->id);
        }
    }

    private function buildIdempotencyKey(Cart $cart, Address $address, string $shippingMethodId): string
    {
        return hash_hmac(
            'sha256',
            "{$cart->user_id}:{$cart->id}:{$cart->version}:{$address->id}:{$shippingMethodId}",
            config('app.key')
        );
    }
}