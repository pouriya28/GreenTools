<?php

namespace App\DTOs\Order;

final class OrderFilterDTO
{
    public function __construct(
        public readonly ?string $status = null,
        public readonly ?string $dateFrom = null,
        public readonly ?string $dateTo = null,
        public readonly ?string $search = null,
        public readonly int $perPage = 20,
        public readonly int $page = 1,
    ) {
    }

    public static function fromArray(array $validated): self
    {
        return new self(
            status: $validated['status'] ?? null,
            dateFrom: $validated['date_from'] ?? null,
            dateTo: $validated['date_to'] ?? null,
            search: isset($validated['search']) ? trim($validated['search']) : null,
            // دفاع دوم: حتی اگه یه‌جا FormRequest دور زده بشه (مثلاً فراخوانی داخلی سرویس)، اینجا هم کلمپ میشه
            perPage: min((int) ($validated['per_page'] ?? 20), 50),
            page: max((int) ($validated['page'] ?? 1), 1),
        );
    }
}