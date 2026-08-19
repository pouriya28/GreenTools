<?php

namespace App\Services\Product;

use App\DTOs\Product\ProductFilterDTO;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class ProductFilterService
{
    public function paginate(ProductFilterDTO $filters): LengthAwarePaginator
    {
        $query = Product::query()
            ->active()
            ->with(['category:id,name,slug', 'primaryImage'])
            ->withCount([]);

        $this->applyCategoryFilter($query, $filters);
        $this->applySearchFilter($query, $filters);
        $this->applyPriceFilter($query, $filters);
        $this->applyStockFilter($query, $filters);
        $this->applyDiscountFilter($query, $filters);
        $this->applyFeaturedFilter($query, $filters);
        $this->applySort($query, $filters->sort);

        return $query->paginate($filters->perPage, ['*'], 'page', $filters->page)->withQueryString();
    }

    private function applyCategoryFilter(Builder $query, ProductFilterDTO $filters): void
    {
        if (!$filters->categorySlug) {
            return;
        }

        $category = Category::query()
            ->where('slug', $filters->categorySlug)
            ->first(['id']);

        if (!$category) {
            $query->whereRaw('1 = 0');
            return;
        }

        $categoryIds = $this->collectDescendantIds($category->id);
        $categoryIds[] = $category->id;

        $query->whereIn('category_id', $categoryIds);
    }

    private function collectDescendantIds(int $categoryId): array
    {
        $ids = [];
        $currentLevel = [$categoryId];

        while (!empty($currentLevel)) {
            $children = Category::query()
                ->whereIn('parent_id', $currentLevel)
                ->pluck('id')
                ->toArray();

            $ids = array_merge($ids, $children);
            $currentLevel = $children;
        }

        return $ids;
    }

    private function applySearchFilter(Builder $query, ProductFilterDTO $filters): void
    {
        if (!$filters->search) {
            return;
        }

        // escape کردن wildcard های LIKE - بدون این، % و _ و \ کاربر
        // به‌عنوان کاراکتر خاص SQL تفسیر میشن (نه SQL injection کلاسیک، ولی می‌تونه
        // جستجو رو دستکاری یا کوئری رو غیرمنتظره سنگین کنه)
        $search = $this->escapeLike($filters->search);

        $query->where(function (Builder $q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
                ->orWhere('sku', 'like', "%{$search}%")
                ->orWhere('short_description', 'like', "%{$search}%");
        });
    }

    private function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }

    private function applyPriceFilter(Builder $query, ProductFilterDTO $filters): void
    {
        // ستون 'price' با مایگریشن add_usd_pricing_to_products_table به
        // 'price_toman' تغییر نام پیدا کرد؛ این متد قبلاً هنوز 'price' رو
        // کوئری می‌کرد که چون این ستون دیگه در جدول وجود ندارد، هر درخواست
        // با min_price/max_price باعث خطای SQL (500) می‌شد.
        if ($filters->minPrice !== null) {
            $query->where('price_toman', '>=', $filters->minPrice);
        }
        if ($filters->maxPrice !== null) {
            $query->where('price_toman', '<=', $filters->maxPrice);
        }
    }

    private function applyStockFilter(Builder $query, ProductFilterDTO $filters): void
    {
        if ($filters->inStock) {
            $query->inStock();
        }
    }

    private function applyDiscountFilter(Builder $query, ProductFilterDTO $filters): void
    {
        if ($filters->hasDiscount) {
            $query->whereNotNull('discount_type')
                ->where(function (Builder $q) {
                    $q->whereNull('discount_starts_at')->orWhere('discount_starts_at', '<=', now());
                })
                ->where(function (Builder $q) {
                    $q->whereNull('discount_ends_at')->orWhere('discount_ends_at', '>=', now());
                });
        }
    }

    private function applyFeaturedFilter(Builder $query, ProductFilterDTO $filters): void
    {
        if ($filters->isFeatured) {
            $query->where('is_featured', true);
        }
    }

    private function applySort(Builder $query, string $sort): void
    {
        // sort از whitelist ثابت FormRequest میاد، پس امن است که مستقیم map بشه.
        // 'price' اینجا هم به 'price_toman' اصلاح شد (همون دلیل applyPriceFilter).
        match ($sort) {
            'oldest' => $query->oldest(),
            'price_asc' => $query->orderBy('price_toman', 'asc'),
            'price_desc' => $query->orderBy('price_toman', 'desc'),
            'most_purchased' => $query->orderByDesc('purchases_count'),
            'most_liked' => $query->orderByDesc('likes_count'),
            'most_viewed' => $query->orderByDesc('views_count'),
            default => $query->latest(),
        };
    }
}
