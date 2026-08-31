<?php

namespace App\Jobs;

use App\Enums\OrderStatus;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class ExpireInventoryReservationsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $expired = InventoryReservation::where('status', 'active')
            ->where('expires_at', '<=', now())
            ->pluck('order_id')
            ->unique();

        foreach ($expired as $orderId) {
            DB::transaction(function () use ($orderId) {
                $order = Order::where('id', $orderId)->lockForUpdate()->first();

                if ($order === null || $order->status !== OrderStatus::PendingPayment) {
                    return; // Already paid/cancelled by another path — do not touch it.
                }

                InventoryReservation::where('order_id', $orderId)
                    ->where('status', 'active')
                    ->where('expires_at', '<=', now())
                    ->update(['status' => 'expired']);

                Payment::where('order_id', $orderId)
                    ->where('status', 'pending')
                    ->update(['status' => 'failed']);

                $order->transitionTo(OrderStatus::Cancelled);
            });
        }
    }
}