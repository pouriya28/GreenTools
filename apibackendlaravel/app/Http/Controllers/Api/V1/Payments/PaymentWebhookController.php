<?php

namespace App\Http\Controllers\Api\V1\Payments;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\Payment;
use App\Services\Payments\PaymentGatewayFactory;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    public function __construct(private readonly PaymentGatewayFactory $gatewayFactory)
    {
    }

    public function handle(Request $request, string $gateway): Response
    {
        try {
            $gatewayImpl = $this->gatewayFactory->make($gateway);
        } catch (\InvalidArgumentException $e) {
            Log::warning('Payment webhook for unknown gateway.', ['gateway' => $gateway]);

            return response('', 404);
        }

        $rawBody = $request->getContent();

        // Fail closed: any verification failure is rejected without side effects.
        if (! $gatewayImpl->verifyCallback($request->headers->all(), $rawBody)) {
            Log::warning('Rejected payment webhook: signature verification failed.', [
                'gateway' => $gateway,
                'ip' => $request->ip(),
            ]);

            return response('', 401);
        }

        $payload = json_decode($rawBody, true) ?? [];
        $transactionId = $gatewayImpl->extractTransactionId($payload);

        if ($transactionId === null) {
            return response('', 400);
        }

        DB::transaction(function () use ($gateway, $gatewayImpl, $payload, $transactionId) {
            $payment = Payment::where('transaction_id', $transactionId)
                ->lockForUpdate()
                ->first();

            if ($payment === null) {
                $payment = Payment::where('id', $payload['payment_id'] ?? null)
                    ->lockForUpdate()
                    ->first();
            }

            if ($payment === null) {
                Log::warning('Payment webhook referenced unknown payment.', ['transaction_id' => $transactionId]);

                return;
            }

            // Defense in depth: a payment created under one gateway must never be
            // finalized by a callback verified under a different gateway's route/slug.
            if ($payment->gateway !== $gateway) {
                Log::warning('Payment webhook gateway mismatch.', [
                    'payment_id' => $payment->id,
                    'expected_gateway' => $payment->gateway,
                    'received_gateway' => $gateway,
                ]);

                return;
            }

            // Idempotent: if this payment was already finalized by an earlier callback
            // or the success-redirect path, do nothing on a duplicate delivery.
            // Compared against the enum case itself — Payment::status is cast to
            // PaymentStatus, so comparing it to a raw string is always unequal.
            if ($payment->status !== PaymentStatus::Pending) {
                return;
            }

            $order = Order::where('id', $payment->order_id)->lockForUpdate()->first();

            if ($order === null) {
                Log::error('Payment webhook: payment references a missing order.', [
                    'payment_id' => $payment->id,
                    'order_id' => $payment->order_id,
                ]);

                return;
            }

            if ($gatewayImpl->wasSuccessful($payload)) {
                $this->markPaid($payment, $order, $transactionId);
            } else {
                $this->markFailed($payment, $order);
            }
        });

        return response('', 200);
    }

    private function markPaid(Payment $payment, Order $order, string $transactionId): void
    {
        $payment->transitionTo(PaymentStatus::Paid);
        $payment->update(['transaction_id' => $transactionId]);
        $order->transitionTo(OrderStatus::Paid);

        $reservations = InventoryReservation::where('order_id', $order->id)
            ->where('status', 'active')
            ->get();

        foreach ($reservations as $reservation) {
            // Row-lock the product to safely perform the permanent, one-time deduction.
            $product = \App\Models\Product::where('id', $reservation->product_id)
                ->lockForUpdate()
                ->first();

            if ($product !== null) {
                $product->decrement('stock_quantity', $reservation->quantity);
            }

            $reservation->update(['status' => 'confirmed']);
        }

        \App\Events\OrderPlaced::dispatch($order);
    }

    private function markFailed(Payment $payment, Order $order): void
    {
        $payment->transitionTo(PaymentStatus::Failed);

        InventoryReservation::where('order_id', $order->id)
            ->where('status', 'active')
            ->update(['status' => 'expired']);
        // Stock quantity itself is untouched — it was never decremented pre-payment,
        // only "held" via the active reservation, which is now released.
    }
}