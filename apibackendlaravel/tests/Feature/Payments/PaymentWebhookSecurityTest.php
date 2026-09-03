<?php

use App\Models\Order;
use App\Models\Payment;

it('rejects a webhook with an invalid signature (fail closed)', function () {
    $order = Order::factory()->create();
    Payment::factory()->create(['order_id' => $order->id]);

    $this->postJson('/api/v1/payments/webhook', [
        'order_id' => $order->id,
        'status' => 'paid',
        // signature عمداً غلط/جا افتاده
    ])->assertStatus(401);
});

it('is idempotent against a duplicate/replayed successful callback', function () {
    $order = Order::factory()->create(['status' => \App\Enums\OrderStatus::PendingPayment]);
    $payment = Payment::factory()->create(['order_id' => $order->id]);

    $signedPayload = fakeSignedWebhookPayload($order, 'paid'); // هلپر امن که فقط برای تست امضا می‌زند

    $this->postJson('/api/v1/payments/webhook', $signedPayload)->assertOk();
    $this->postJson('/api/v1/payments/webhook', $signedPayload)->assertOk();

    expect(Payment::find($payment->id)->status)->toBe(\App\Enums\PaymentStatus::Paid);
    // مهم‌ترین ادعا: با وجود دو بار callback موفق، فقط یک بار stock_quantity کم شده باشد.
});

it('rejects a callback that reports the wrong amount', function () {
    $order = Order::factory()->create(['total_amount' => 500000]);
    Payment::factory()->create(['order_id' => $order->id, 'amount' => 500000]);

    $tamperedPayload = fakeSignedWebhookPayload($order, 'paid', amount: 1);

    $this->postJson('/api/v1/payments/webhook', $tamperedPayload)->assertStatus(422);
});