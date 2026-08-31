<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Payment;

class AbstractPaymentGateway implements PaymentGatewayInterface
{
    public function createPaymentIntent(Payment $payment): string
    {
        throw new \RuntimeException('No payment gateway configured yet.');
    }

    public function verifyCallback(array $headers, string $rawBody): bool
    {
        // Fail closed by default — a real gateway implementation must override
        // this with actual signature/HMAC verification before going to production.
        return false;
    }

    public function extractTransactionId(array $payload): ?string
    {
        return $payload['transaction_id'] ?? null;
    }

    public function wasSuccessful(array $payload): bool
    {
        return false;
    }
}