import { PRODUCT_SORT_OPTIONS, type ProductSort } from "../types/filters.types";

const SORT_LABELS: Record<ProductSort, string> = {
  newest: "جدیدترین", oldest: "قدیمی‌ترین",
  price_asc: "ارزان‌ترین", price_desc: "گران‌ترین",
  most_purchased: "پرفروش‌ترین", most_liked: "محبوب‌ترین", most_viewed: "پربازدیدترین",
};

interface SortSelectProps {
  value?: ProductSort;
  onChange: (sort: ProductSort | null) => void;
}

// امن ذاتاً: مقدار select همیشه یکی از option هاییه که خودمون رندر کردیم - نیاز به whitelist جدا نیست
export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <select
      value={value ?? "newest"}
      onChange={(e) => onChange(e.target.value as ProductSort)}
      className="px-3 py-2 rounded-xl bg-background border border-border text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {PRODUCT_SORT_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>{SORT_LABELS[opt]}</option>
      ))}
    </select>
  );
}