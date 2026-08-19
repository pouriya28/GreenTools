import { api } from "@/lib/axios";
import type { PaginatedResponse } from "@/shared/types/pagination.types";
import { PRODUCT_SORT_OPTIONS, type ProductFiltersState, type ProductSort } from "../types/filters.types";
import type { Product } from "../components/ProductCard/ProductTypes";

const MAX_PAGE = 100_000;
const DEFAULT_PER_PAGE = 20;

// دفاع سمت کلاینت: حتی اگه یه باگ UI مقدار نامعتبر بسازه، اینجا کلمپ/whitelist میشه
// قبل از ارسال (بکند هم خودش دوباره validate می‌کنه؛ این فقط لایه‌ی اضافه‌ست)
function sanitizeFilters(filters: ProductFiltersState, page: number) {
  const sort: ProductSort | undefined =
    filters.sort && (PRODUCT_SORT_OPTIONS as readonly string[]).includes(filters.sort) ? filters.sort : undefined;

  return {
    category_slug: filters.categorySlug || undefined,
    search: filters.search?.trim().slice(0, 100) || undefined,
    min_price: filters.minPrice !== undefined && filters.minPrice >= 0 ? Math.trunc(filters.minPrice) : undefined,
    max_price: filters.maxPrice !== undefined && filters.maxPrice >= 0 ? Math.trunc(filters.maxPrice) : undefined,
    in_stock: filters.inStock || undefined,
    has_discount: filters.hasDiscount || undefined,
    is_featured: filters.isFeatured || undefined,
    sort,
    per_page: DEFAULT_PER_PAGE,
    page: Math.min(Math.max(Math.trunc(page), 1), MAX_PAGE),
  };
}

export async function fetchProducts(
  filters: ProductFiltersState,
  page: number,
  signal?: AbortSignal
): Promise<PaginatedResponse<Product>> {
  const { data } = await api.get<PaginatedResponse<Product>>("/v1/products", {
    params: sanitizeFilters(filters, page),
    signal, // ریکوئست قدیمی کنسل میشه وقتی فیلتر سریع عوض میشه (جلوی race condition)
  });
  return data;
}

export async function fetchFeaturedProducts(signal?: AbortSignal): Promise<PaginatedResponse<Product>> {
  const { data } = await api.get<PaginatedResponse<Product>>("/v1/products/featured", {
    
    signal,
  });
  return data;
}