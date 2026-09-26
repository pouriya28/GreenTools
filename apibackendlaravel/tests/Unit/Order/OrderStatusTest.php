<?php

use App\Enums\OrderStatus;
use App\Exceptions\Order\InvalidOrderTransitionException;
use App\Models\Order;

// ---------------------------------------------------------------------------
// State machine — allowed transitions
// ---------------------------------------------------------------------------

it('PendingPayment can transition to Paid', function (): void {
    expect(OrderStatus::PendingPayment->canTransitionTo(OrderStatus::Paid))->toBeTrue();
});

it('PendingPayment can transition to Cancelled', function (): void {
    expect(OrderStatus::PendingPayment->canTransitionTo(OrderStatus::Cancelled))->toBeTrue();
});

it('Paid can transition to Processing', function (): void {
    expect(OrderStatus::Paid->canTransitionTo(OrderStatus::Processing))->toBeTrue();
});

it('Processing can transition to Packed', function (): void {
    expect(OrderStatus::Processing->canTransitionTo(OrderStatus::Packed))->toBeTrue();
});

it('Packed can transition to Shipped', function (): void {
    expect(OrderStatus::Packed->canTransitionTo(OrderStatus::Shipped))->toBeTrue();
});

it('Shipped can transition to Delivered', function (): void {
    expect(OrderStatus::Shipped->canTransitionTo(OrderStatus::Delivered))->toBeTrue();
});

// ---------------------------------------------------------------------------
// State machine — illegal transitions
// ---------------------------------------------------------------------------

it('PendingPayment cannot skip directly to Processing', function (): void {
    expect(OrderStatus::PendingPayment->canTransitionTo(OrderStatus::Processing))->toBeFalse();
});

it('Paid cannot go back to PendingPayment', function (): void {
    expect(OrderStatus::Paid->canTransitionTo(OrderStatus::PendingPayment))->toBeFalse();
});

it('Processing cannot skip to Shipped', function (): void {
    expect(OrderStatus::Processing->canTransitionTo(OrderStatus::Shipped))->toBeFalse();
});

it('Delivered is a terminal state — no transitions allowed', function (): void {
    foreach (OrderStatus::cases() as $next) {
        expect(OrderStatus::Delivered->canTransitionTo($next))->toBeFalse();
    }
});

it('Cancelled is a terminal state — no transitions allowed', function (): void {
    foreach (OrderStatus::cases() as $next) {
        expect(OrderStatus::Cancelled->canTransitionTo($next))->toBeFalse();
    }
});

// ---------------------------------------------------------------------------
// Order::transitionTo — DB model
// ---------------------------------------------------------------------------

it('transitionTo updates the order status in the database', function (): void {
    $order = Order::factory()->create(['status' => OrderStatus::PendingPayment]);

    $order->transitionTo(OrderStatus::Paid);

    expect($order->fresh()->status)->toBe(OrderStatus::Paid);
});

it('transitionTo throws InvalidOrderTransitionException for an illegal jump', function (): void {
    $order = Order::factory()->create(['status' => OrderStatus::PendingPayment]);

    expect(fn () => $order->transitionTo(OrderStatus::Delivered))
        ->toThrow(InvalidOrderTransitionException::class);
});

it('transitionTo does not persist the status when the transition is illegal', function (): void {
    $order = Order::factory()->create(['status' => OrderStatus::PendingPayment]);

    try {
        $order->transitionTo(OrderStatus::Delivered);
    } catch (InvalidOrderTransitionException) {
        // expected
    }

    expect($order->fresh()->status)->toBe(OrderStatus::PendingPayment);
});

it('allowedNextStates returns an empty array for terminal statuses', function (): void {
    expect(OrderStatus::Delivered->allowedNextStates())->toBeEmpty()
        ->and(OrderStatus::Cancelled->allowedNextStates())->toBeEmpty();
});
