import { FaTimes } from "react-icons/fa";
import type { ProductFiltersState } from "../../types/filters.types";

interface ActiveFiltersBarProps {
  filters: ProductFiltersState;
  onRemoveCategory: () => void;
  onRemoveSearch: () => void;
  onRemovePriceRange: () => void;
  onRemoveFlag: (key: "in_stock" | "has_discount" | "is_featured") => void;
  onClearAll: () => void;
}

// امن: filters.search مستقیم داخل JSX رندر میشه، نه innerHTML - پس حتی اگه کاربر </script> یا HTML بنویسه، فقط متن خام نمایش داده میشه
export function ActiveFiltersBar({ filters, onRemoveCategory, onRemoveSearch, onRemovePriceRange, onRemoveFlag, onClearAll }: ActiveFiltersBarProps) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (filters.categorySlug) chips.push({ key: "category", label: "دسته منتخب", onRemove: onRemoveCategory });
  if (filters.search) chips.push({ key: "search", label: `جستجو: ${filters.search}`, onRemove: onRemoveSearch });
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined)
    chips.push({ key: "price", label: "محدوده قیمت", onRemove: onRemovePriceRange });
  if (filters.inStock) chips.push({ key: "in_stock", label: "فقط موجود", onRemove: () => onRemoveFlag("in_stock") });
  if (filters.hasDiscount) chips.push({ key: "has_discount", label: "دارای تخفیف", onRemove: () => onRemoveFlag("has_discount") });
  if (filters.isFeatured) chips.push({ key: "is_featured", label: "ویژه", onRemove: () => onRemoveFlag("is_featured") });

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {chips.map((chip) => (
        <span key={chip.key} className="flex items-center gap-1.5 pr-1 pl-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
          {chip.label}
          <button type="button" onClick={chip.onRemove} aria-label="حذف فیلتر" className="hover:text-error transition">
            <FaTimes />
          </button>
        </span>
      ))}
      <button type="button" onClick={onClearAll} className="text-xs text-muted hover:text-error underline underline-offset-2">
        پاک‌کردن همه
      </button>
    </div>
  );
}