import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { AlertTriangle, Loader2, Plus, Search, Trash2 } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useCategories } from "@/features/categories/hooks/useCategories"
import { useProducts } from "../hooks/useProducts"
import { useToggleFeaturedProduct } from "../hooks/useProductMutations"
import { ProductTable } from "../components/ProductTable"
import { ProductFilters } from "../components/ProductFilters"
import { ProductFormDialog } from "../components/ProductFormDialog"
import { DeleteProductDialog } from "../components/DeleteProductDialog"
import { buildCategoryOptions } from "../utils"
import type { ProductFilters as ProductFiltersValue, ProductListItem, StockStatus } from "../types"

// فیلترها الان فقط search/page نیستن، بلکه دسته‌بندی/وضعیت/مرتب‌سازی همونقد از URL
// خونده می‌شن تا رفرش صفحه و بازگشت با دکمه هم حفظ بمونن.
function parseFiltersFromSearchParams(searchParams: URLSearchParams): ProductFiltersValue {
  const categoryId = searchParams.get("category_id")
  const isActive = searchParams.get("is_active")
  const stockStatus = searchParams.get("stock_status")
  const sort = searchParams.get("sort")

  return {
    search: searchParams.get("search") ?? "",
    page: Number(searchParams.get("page") ?? "1"),
    category_id: categoryId ? Number(categoryId) : undefined,
    is_active: isActive === null ? undefined : isActive === "1",
    stock_status: (stockStatus as StockStatus) || undefined,
    sort: (sort as ProductFiltersValue["sort"]) || undefined,
  }
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = parseFiltersFromSearchParams(searchParams)

  const { data, isLoading, isError, refetch, isFetching } = useProducts(filters)
  const { data: categories } = useCategories()
  const categoryOptions = buildCategoryOptions(categories ?? [])
  const toggleFeaturedMutation = useToggleFeaturedProduct()

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(null)
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<number | null>(null)

  function handleCreate() {
    setEditingProductId(null)
    setFormDialogOpen(true)
  }

  function handleEdit(product: ProductListItem) {
    setEditingProductId(product.id)
    setFormDialogOpen(true)
  }

  function handleFormOpenChange(open: boolean) {
    setFormDialogOpen(open)
    if (!open) setEditingProductId(null)
  }

  function handleDeleteOpenChange(open: boolean) {
    if (!open) setDeleteTarget(null)
  }

  function handleSearchChange(value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set("search", value)
      else next.delete("search")
      next.set("page", "1")
      return next
    })
  }

  function handleFiltersChange(patch: Partial<ProductFiltersValue>) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("page", "1")

      if ("category_id" in patch) {
        if (patch.category_id) next.set("category_id", String(patch.category_id))
        else next.delete("category_id")
      }
      if ("is_active" in patch) {
        if (patch.is_active === undefined) next.delete("is_active")
        else next.set("is_active", patch.is_active ? "1" : "0")
      }
      if ("stock_status" in patch) {
        if (patch.stock_status) next.set("stock_status", patch.stock_status)
        else next.delete("stock_status")
      }
      if ("sort" in patch) {
        if (patch.sort) next.set("sort", patch.sort)
        else next.delete("sort")
      }
      return next
    })
  }

  function handlePageChange(nextPage: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("page", String(nextPage))
      return next
    })
  }

  async function handleToggleFeatured(product: ProductListItem) {
    setTogglingFeaturedId(product.id)
    try {
      await toggleFeaturedMutation.mutateAsync(product.id)
    } finally {
      setTogglingFeaturedId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-1">مجودات</h1>
          <p className="text-sm text-text-2">{data ? `${data.meta.total} مجود` : "مدیریت محصولات فروشگاه"}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/products/trash" className={cn(buttonVariants({ variant: "outline" }))}>
            <Trash2 className="h-4 w-4" />
            سطل‌زباله
          </Link>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            افزودن محصول
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
          <Input
            placeholder="جستوجوی نام یا SKU..."
            defaultValue={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pr-9"
          />
        </div>

        <ProductFilters filters={filters} categoryOptions={categoryOptions} onChange={handleFiltersChange} />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border py-16 text-text-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          در حال بارگذاری محصولات...
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 py-12 text-danger">
          <AlertTriangle className="h-6 w-6" />
          <p className="text-sm">دریافت محصولات با خطا مواجه شد.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
            تلاش دوباره
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <ProductTable
          products={data?.data ?? []}
          meta={data?.meta}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onDeleteRequest={setDeleteTarget}
          onToggleFeatured={handleToggleFeatured}
          togglingFeaturedId={togglingFeaturedId}
        />
      )}

      <ProductFormDialog open={formDialogOpen} onOpenChange={handleFormOpenChange} productId={editingProductId} />

      <DeleteProductDialog product={deleteTarget} open={deleteTarget !== null} onOpenChange={handleDeleteOpenChange} />
    </div>
  )
}
