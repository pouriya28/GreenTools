<?php
// app/Listeners/NotifyAdminsOfNewOrder.php

namespace App\Listeners;

use App\Events\OrderPlaced;
use App\Models\User;
use App\Notifications\NewOrderPlacedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Notification;

class NotifyAdminsOfNewOrder implements ShouldQueue
{
    /**
     * CRITICAL: defers actually pushing this queued listener to the queue
     * until the enclosing DB transaction in markPaid() commits. Without
     * this, a rollback (e.g. a later exception in the same transaction)
     * could still notify admins about an order that never actually exists.
     */
    public bool $afterCommit = true;

    public function handle(OrderPlaced $event): void
    {
        // Mirrors the "notify every admin role user, not one fixed email"
        // pattern already established in ExchangeRateAlertNotifier.
        
        $recipients = User::query()
            ->where('is_active', true)
            ->whereIn('user_type', ['admin', 'staff'])
            ->get()
            ->filter(fn (User $user) => $user->can('orders.view'));

        if ($recipients->isEmpty()) {
            return;
        }
        Notification::send(
            $recipients,
            new NewOrderPlacedNotification($event->order->id, $event->order->total_amount),
        );
    }
}