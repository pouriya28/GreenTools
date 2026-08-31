<?php

namespace App\Http\Controllers\Api\V1\Payments;

use App\Contracts\PaymentGatewayInterface;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    public function __construct(private readonly PaymentGatewayInterface $gateway)
    {
    }

    public function handle(Request $request): Response
    {
        $rawBody = $request->getContent();

        // Fail closed: any verification failure is rejected without side effects.
        if (! $this->gateway->verifyCallback($request->headers->all(), $rawBody)) {
            Log::warning('Rejected payment webhook: signature verification failed.', [
                'ip' => $request->ip(),
            ]);

            return response('', 401);
        }

        $payload = json_decode($rawBody, true) ?? [];
        $transactionId = $this->gateway->extractTransactionId($payload);

        if ($transactionId === null) {
            return response('', 400);
        }

        DB::transaction(function () use ($payload, $transactionId) {
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

            // Idempotent: if this payment was already finalized by an earlier callback
            // or the success-redirect path, do nothing on a duplicate delivery.
            if ($payment->status !== 'pending') {
                return;
            }

            $order = Order::where('id', $payment->order_id)->lockForUpdate()->first();

            if ($this->gateway->wasSuccessful($payload)) {
                $this->markPaid($payment, $order, $transactionId);
            } else {
                $this->markFailed($payment, $order);
            }
        });

        return response('', 200);
    }

    private function markPaid(Payment $payment, Order $order, string $transactionId): void
    {
        $payment->update(['status' => 'paid', 'transaction_id' => $transactionId]);

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
    }

    private function markFailed(Payment $payment, Order $order): void
    {
        $payment->update(['status' => 'failed']);

        InventoryReservation::where('order_id', $order->id)
            ->where('status', 'active')
            ->update(['status' => 'expired']);

        // Stock quantity itself is untouched — it was never decremented pre-payment,
        // only "held" via the active reservation, which is now released.
    }
}