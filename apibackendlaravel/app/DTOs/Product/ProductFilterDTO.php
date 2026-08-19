<?php

namespace App\DTOs\Product;

final class ProductFilterDTO
{
    public function __construct(
        public readonly ?string $categorySlug = null,
        public readonly ?string $search = null,
        public readonly ?int $minPrice = null,
        public readonly ?int $maxPrice = null,
        public readonly bool $inStock = false,
        public readonly bool $hasDiscount = false,
        public readonly bool $isFeatured = false,
        public readonly string $sort = 'newest',
        public readonly int $perPage = 20,
        public readonly int $page = 1,
    ) {}

    public static function fromArray(array $validated): self
    {
        return new self(
            categorySlug: $validated['category_slug'] ?? null,
            search: isset($validated['search']) ? trim($validated['search']) : null,
            minPrice: isset($validated['min_price']) ? (int) $validated['min_price'] : null,
            maxPrice: isset($validated['max_price']) ? (int) $validated['max_price'] : null,
            inStock: (bool) ($validated['in_stock'] ?? false),
            hasDiscount: (bool) ($validated['has_discount'] ?? false),
            isFeatured: (bool) ($validated['is_featured'] ?? false),
            sort: $validated['sort'] ?? 'newest',
            // دفاع دوم: حتی اگه یه‌جا FormRequest دور زده بشه (مثلاً فراخوانی داخلی سرویس)، اینجا هم کلمپ میشه
            perPage: min((int) ($validated['per_page'] ?? 20), 50),
            page: max((int) ($validated['page'] ?? 1), 1),
        );
    }
}