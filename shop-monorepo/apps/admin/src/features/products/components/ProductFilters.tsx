import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ProductFilters as ProductFiltersValue, StockStatus } from "../types"
import type { CategoryOption } from "../utils"

interface ProductFiltersProps {
  filters: ProductFiltersValue
  categoryOptions: CategoryOption[]
  onChange: (next: Partial<ProductFiltersValue>) => void
}

const ALL = "__all__"

export function ProductFilters({ filters, categoryOptions, onChange }: ProductFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={filters.category_id ? String(filters.category_id) : ALL}
        onValueChange={(value) => onChange({ category_id: value === ALL ? undefined : Number(value) })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="دسته‌بندی" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>همه‌ی دسته‌بندی‌ها</SelectItem>
          {categoryOptions.map((option) => (
            <SelectItem key={option.id} value={String(option.id)}>
              {"\u2014 ".repeat(option.depth)}
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.stock_status ?? ALL}
        onValueChange={(value) => onChange({ stock_status: value === ALL ? undefined : (value as StockStatus) })}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="وضعیت موجودی" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>همه‌ی وضعیت‌ها</SelectItem>
          <SelectItem value="in_stock">موجود</SelectItem>
          <SelectItem value="out_of_stock">ناموجود</SelectItem>
          <SelectItem value="preorder">پیش‌سفارش</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.is_active === undefined ? ALL : filters.is_active ? "active" : "inactive"}
        onValueChange={(value) => onChange({ is_active: value === ALL ? undefined : value === "active" })}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="وضعیت فعالیت" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>همه</SelectItem>
          <SelectItem value="active">فعال</SelectItem>
          <SelectItem value="inactive">غیرفعال</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.sort ?? "newest"} onValueChange={(value) => onChange({ sort: value as ProductFiltersValue["sort"] })}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="مرتب‌سازی" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">جدیدترین</SelectItem>
          <SelectItem value="oldest">قدیمی‌ترین</SelectItem>
          <SelectItem value="price_asc">ارزان‌ترین قیمت</SelectItem>
          <SelectItem value="price_desc">گران‌ترین قیمت</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
