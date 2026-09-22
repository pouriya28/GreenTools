<?php
// app/Events/OrderPlaced.php

namespace App\Events;

use App\Models\Order;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired only when an order transitions to Paid (a real, confirmed order) —
 * never for a pending_payment row that might still expire/cancel. This is
 * the single trigger point admin notifications are built from.
 */
class OrderPlaced
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly Order $order)
    {
    }
}