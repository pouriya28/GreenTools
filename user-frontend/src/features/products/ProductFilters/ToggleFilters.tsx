interface ToggleFiltersProps {
  inStock?: boolean;
  hasDiscount?: boolean;
  isFeatured?: boolean;
  onToggle: (key: "in_stock" | "has_discount" | "is_featured") => void;
}

const OPTIONS = [
  { key: "in_stock" as const, label: "فقط موجود" },
  { key: "has_discount" as const, label: "دارای تخفیف" },
  { key: "is_featured" as const, label: "محصولات ویژه" },
];

export function ToggleFilters({ inStock, hasDiscount, isFeatured, onToggle }: ToggleFiltersProps) {
  const active = { in_stock: !!inStock, has_discount: !!hasDiscount, is_featured: !!isFeatured };

  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => (
        <button key={opt.key} type="button" onClick={() => onToggle(opt.key)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${active[opt.key] ? "bg-primary text-white border-primary" : "bg-surface text-text-secondary border-border hover:border-primary"}`}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}