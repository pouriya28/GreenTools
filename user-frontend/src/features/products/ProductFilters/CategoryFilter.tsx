import { useCategories } from "../hooks/useCategories";

interface CategoryFilterProps {
  selectedSlug?: string;
  onChange: (slug: string | null) => void;
}

export function CategoryFilter({ selectedSlug, onChange }: CategoryFilterProps) {
  const { data: categories, isLoading } = useCategories();

  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-text font-bold text-sm mb-2">دسته‌بندی</h4>

      <button type="button" onClick={() => onChange(null)}
        className={`text-start px-3 py-2 rounded-xl text-sm transition ${!selectedSlug ? "bg-primary/10 text-primary font-semibold" : "text-text-secondary hover:bg-background"}`}>
        همه‌ی محصولات
      </button>

      {isLoading && Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-8 rounded-xl bg-border/50 animate-pulse mt-1" />
      ))}

      {categories?.map((cat) => (
        <button key={cat.id} type="button" onClick={() => onChange(cat.slug)}
          className={`text-start px-3 py-2 rounded-xl text-sm transition ${selectedSlug === cat.slug ? "bg-primary/10 text-primary font-semibold" : "text-text-secondary hover:bg-background"}`}>
          {cat.name}
        </button>
      ))}
    </div>
  );
}