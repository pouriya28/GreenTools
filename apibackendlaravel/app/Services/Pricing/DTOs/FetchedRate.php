<?php

namespace App\Services\Pricing\DTOs;

final class FetchedRate
{
    public function __construct(
        public readonly float $rate,
        public readonly string $source,
        public readonly \DateTimeImmutable $fetchedAt,
        public readonly ?string $rawResponse = null,
    ) {}
}