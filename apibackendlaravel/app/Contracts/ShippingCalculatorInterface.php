<?php
// app/Contracts/ShippingCalculatorInterface.php

namespace App\Contracts;

use App\Models\Address;
use App\Models\ShippingMethod;
use App\Services\Shipping\ShippingQuote;

interface ShippingCalculatorInterface
{
    /**
     * @throws \App\Exceptions\Shipping\ShippingMethodUnavailableException
     * @throws \App\Exceptions\Shipping\ShippingMethodNotSupportedException
     */
    public function calculate(
        ShippingMethod $method,
        int $cartWeightGrams,
        int $cartSubtotal,
        ?Address $address = null,
    ): ShippingQuote;
}
