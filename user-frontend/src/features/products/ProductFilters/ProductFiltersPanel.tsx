import type { ProductFiltersState } from "../../types/filters.types";
import { CategoryFilter } from "./CategoryFilter";
import { PriceRangeFilter } from "./PriceRangeFilter";
import { ToggleFilters } from "./ToggleFilters";

interface ProductFiltersPanelProps {
  filters: ProductFiltersState;
  onCategoryChange: (slug: string | null) => void;
  onPriceChange: (min: number | null, max: number | null) => void;
  onToggle: (key: "in_stock" | "has_discount" | "is_featured") => void;
}

export function ProductFiltersPanel({ filters, onCategoryChange, onPriceChange, onToggle }: ProductFiltersPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      <CategoryFilter selectedSlug={filters.categorySlug} onChange={onCategoryChange} />
      <PriceRangeFilter minPrice={filters.minPrice} maxPrice={filters.maxPrice} onChange={onPriceChange} />
      <ToggleFilters inStock={filters.inStock} hasDiscount={filters.hasDiscount} isFeatured={filters.isFeatured} onToggle={onToggle} />
    </div>
  );
}