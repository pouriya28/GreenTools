<?php

// app/Services/Payments/PaymentGatewayFactory.php
namespace App\Services\Payments;

use App\Contracts\PaymentGatewayInterface;
use Illuminate\Contracts\Container\Container;
use InvalidArgumentException;

class PaymentGatewayFactory
{
    public function __construct(private readonly Container $container) {}

    public function make(string $slug): PaymentGatewayInterface
    {
        $map = config('payments.gateways', []);

        if (! isset($map[$slug])) {
            throw new InvalidArgumentException("Unknown payment gateway: {$slug}");
        }

        return $this->container->make($map[$slug]);
    }
}
