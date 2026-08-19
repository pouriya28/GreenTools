<?php

namespace App\Services\Pricing;

use App\Services\Pricing\DTOs\FetchedRate;

interface ExchangeRateProviderInterface
{
    /** @throws \App\Services\Pricing\Exceptions\ExchangeRateFetchException */
    public function fetch(): FetchedRate;
}