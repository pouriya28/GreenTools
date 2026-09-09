<?php

namespace App\Services\Checkout;

use App\Enums\OrderStatus;
use App\Exceptions\Cart\InsufficientStockException;
use App\Exceptions\Cart\ProductUnavailableException;
use App\Exceptions\Checkout\AddressNotOwnedException;
use App\Exceptions\Checkout\EmptyCartException;
use App\Exceptions\Checkout\StoreClosedException;
use App\Exceptions\Checkout\TechnicalConsultationRequiredException;
use App\Models\Address;
use App\Models\Cart;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\TechnicalConsultationRequest;
use App\Services\AddressService;
use App\Services\Inventory\StockAvailabilityService;
use App\Services\StoreStatusService;
use Illuminate\Support\Facades\DB;

class CheckoutService
{
    private const RESERVATION_MINUTES = 30;

    public function __construct(
        private readonly StockAvailabilityService $stockAvailability,
        private readonly AddressService $addressService,
        private readonly StoreStatusService $storeStatus,
    ) {
    }

    public function checkout(Cart $cart, Address $address): Order
    {
        // اولین چک: اگر فروشگاه توسط ادمین بسته شده، هیچ سفارش جدیدی ساخته نمی‌شود.
        // سفارش‌های قبلی (پرداخت/ارسال) تحت تاثیر این قرار نمی‌گیرند.
        if (! $this->storeStatus->isOpen()) {
            throw new StoreClosedException($this->storeStatus->current()->closed_reason);
        }

        // دفاع دوم در برابر IDOR: حتی اگر لایه‌ی کنترلر رد شود، سرویس هم خودش چک می‌کند.
        if ($address->user_id !== $cart->user_id) {
            throw new AddressNotOwnedException($address->id);
        }

        // باگ‌فیکس: آدرس باید در idempotency key لحاظ شود؛ وگرنه تعویض آدرس بدون
        // تریگ کردن سبد، همان سفارش قبلی با آدرس قدیمی برگردانده می‌شد.
        $idempotencyKey = $this->buildIdempotencyKey($cart, $address);

        // Duplicate click / retry with identical cart + address state — return the same order,
        // never create a second one. This check happens before opening the transaction.
        $existing = Order::where('idempotency_key', $idempotencyKey)->first();
        if ($existing !== null) {
            return $existing;
        }

        return DB::transaction(function () use ($cart, $address, $idempotencyKey) {
            $cart->loadMissing('items.product');

            if ($cart->items->isEmpty()) {
                throw new EmptyCartException();
            }

            $lockedProducts = [];
            $orderTotal = 0;
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
                $orderTotal += $subtotal;

                $lockedProducts[] = $product;
                $lineItems[] = [
                    'product' => $product,
                    'quantity' => $cartItem->quantity,
                    'unit_price' => $unitPrice,
                    'subtotal' => $subtotal,
                ];
            }

            $order = Order::create([
                'user_id' => $cart->user_id,
                'cart_id' => $cart->id,
                'status' => OrderStatus::PendingPayment,
                'total_amount' => $orderTotal,
                'idempotency_key' => $idempotencyKey,
            ]);

            // Snapshot آدرس دقیقاً در همان Transaction ساخت سفارش — از این لحظه غیرقابل‌تغییر است.
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
                'gateway' => config('payments.default_gateway', 'abstract'),
                'amount' => $orderTotal,
                'status' => 'pending',
            ]);

            return $order;
        });
    }

    private function assertTechnicalConsultationApprovedIfRequired(int $userId, Product $product): void
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

    private function buildIdempotencyKey(Cart $cart, Address $address): string
    {
        return hash_hmac(
            'sha256',
            "{$cart->user_id}:{$cart->id}:{$cart->version}:{$address->id}",
            config('app.key')
        );
    }
}
