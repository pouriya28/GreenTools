import { useState } from "react";
import { FaSlidersH } from "react-icons/fa";

import { useProductFilters } from "../../hooks/useProductFilters";
import { useProducts } from "../../hooks/useProducts";
import { SearchInput } from "../../ProductFilters/SearchInput";
import { SortSelect } from "../../ProductFilters/SortSelect";
import { ActiveFiltersBar } from "../../ProductFilters/ActiveFiltersBar";
import { ProductFiltersSidebar } from "../../ProductFilters/ProductFiltersSidebar";
import { ProductFiltersSheet } from "../../ProductFilters/ProductFiltersSheet";
import { ProductGrid } from "../../ProductGrid/ProductGrid";

export function ProductsPage() {
  const [sheetOpen, setSheetOpen] = useState(false);

  const { filters, searchInput, setSearchInput, setCategorySlug, setSort, setPriceRange, toggleFlag, clearAll, activeCount } = useProductFilters();
  const { data, isLoading, isError, isFetchingNextPage, hasNextPage, fetchNextPage } = useProducts(filters);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-text font-black text-2xl">محصولات</h1>
        <button type="button" onClick={() => setSheetOpen(true)}
          className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface text-sm font-medium text-text">
          <FaSlidersH />
          فیلترها {activeCount > 0 && `(${activeCount})`}
        </button>
      </div>

      <div className="flex gap-8">
        <ProductFiltersSidebar filters={filters} onCategoryChange={setCategorySlug} onPriceChange={setPriceRange} onToggle={toggleFlag} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1"><SearchInput value={searchInput} onChange={setSearchInput} /></div>
            <SortSelect value={filters.sort} onChange={setSort} />
          </div>

          <ActiveFiltersBar
            filters={filters}
            onRemoveCategory={() => setCategorySlug(null)}
            onRemoveSearch={() => setSearchInput("")}
            onRemovePriceRange={() => setPriceRange(null, null)}
            onRemoveFlag={toggleFlag}
            onClearAll={clearAll}
          />

          <ProductGrid
            pages={data?.pages ?? []}
            isLoading={isLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={!!hasNextPage}
            fetchNextPage={fetchNextPage}
            isError={isError}
          />
        </div>
      </div>

      <ProductFiltersSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filters={filters}
        activeCount={activeCount}
        onCategoryChange={setCategorySlug}
        onPriceChange={setPriceRange}
        onToggle={toggleFlag}
        onClearAll={clearAll}
      />
    </div>
  );
}