<?php

namespace App\Contracts;

use App\Models\Payment;

interface PaymentGatewayInterface
{
    /** Creates a payment intent and returns the URL the customer is redirected to. */
    public function createPaymentIntent(Payment $payment): string;

    /**
     * Verifies a callback's authenticity (signature, token, or IP allowlist).
     * MUST return false on any doubt — never fail open.
     */
    public function verifyCallback(array $headers, string $rawBody): bool;

    /** Extracts a gateway-native transaction reference from a verified callback payload. */
    public function extractTransactionId(array $payload): ?string;

    public function wasSuccessful(array $payload): bool;
}