import type { ProductFiltersState } from "../../types/filters.types";
import { ProductFiltersPanel } from "./ProductFiltersPanel";

interface Props {
  filters: ProductFiltersState;
  onCategoryChange: (slug: string | null) => void;
  onPriceChange: (min: number | null, max: number | null) => void;
  onToggle: (key: "in_stock" | "has_discount" | "is_featured") => void;
}

export function ProductFiltersSidebar(props: Props) {
  return (
    <aside className="
      hidden lg:block w-72 shrink-0
      sticky top-24 self-start
      rounded-3xl border border-border
      bg-surface/70 backdrop-blur-xl
      p-5 max-h-[calc(100vh-7rem)] overflow-y-auto
    ">
      <ProductFiltersPanel {...props} />
    </aside>
  );
}