export const PRODUCT_SORT_OPTIONS = [
  "newest", "oldest", "price_asc", "price_desc",
  "most_purchased", "most_liked", "most_viewed",
] as const;

export type ProductSort = (typeof PRODUCT_SORT_OPTIONS)[number];

export interface ProductFiltersState {
  categorySlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  hasDiscount?: boolean;
  isFeatured?: boolean;
  sort?: ProductSort;
}