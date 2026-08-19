import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { AlertTriangle, ArrowRight, Loader2, PackageOpen } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/shared/lib/apiError"
import { useTrashedProducts } from "../hooks/useTrashedProducts"
import { useRestoreProduct } from "../hooks/useProductMutations"
import { TrashedProductCard } from "../components/TrashedProductCard"
import { ForceDeleteProductDialog } from "../components/ForceDeleteProductDialog"
import type { ProductListItem } from "../types"

export default function TrashedProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get("page") ?? "1")

  const { data, isLoading, isError, refetch, isFetching } = useTrashedProducts(page)
  const restoreMutation = useRestoreProduct()

  const [restoringId, setRestoringId] = useState<number | null>(null)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const [forceDeleteTarget, setForceDeleteTarget] = useState<ProductListItem | null>(null)

  async function handleRestore(product: ProductListItem) {
    setRestoringId(product.id)
    setRestoreError(null)
    try {
      await restoreMutation.mutateAsync(product.id)
    } catch (err) {
      setRestoreError(getApiErrorMessage(err, "بازگردانی ناموفق بود."))
    } finally {
      setRestoringId(null)
    }
  }

  function handlePageChange(nextPage: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("page", String(nextPage))
      return next
    })
  }

  const trashed = data?.data ?? []

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Link to="/products" className={cn(buttonVariants({ variant: "ghost", size: "icon" }))} aria-label="بازگشت به محصولات">
          <ArrowRight className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-text-1">سطل‌زباله محصولات</h1>
          <p className="text-sm text-text-2">{data ? `${data.meta.total} مورد حذف‌شده` : "محصولات حذف‌شده، قابل بازگردانی"}</p>
        </div>
      </div>

      {restoreError && (
        <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{restoreError}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border py-16 text-text-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          در حال بارگذاری سطل‌زباله...
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 py-12 text-danger">
          <AlertTriangle className="h-6 w-6" />
          <p className="text-sm">دریافت سطل‌زباله با خطا مواجه شد.</p>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
            تلاش دوباره
          </button>
        </div>
      )}

      {!isLoading && !isError && trashed.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-text-2">
          <PackageOpen className="h-8 w-8 opacity-50" />
          <p className="text-sm">سطل‌زباله خالیه.</p>
        </div>
      )}

      {!isLoading && !isError && trashed.length > 0 && (
        <div className="flex flex-col gap-2">
          {trashed.map((product) => (
            <TrashedProductCard
              key={product.id}
              product={product}
              onRestore={handleRestore}
              onForceDeleteRequest={setForceDeleteTarget}
              isRestoring={restoringId === product.id}
            />
          ))}
        </div>
      )}

      {data && data.meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={data.meta.current_page <= 1}
            onClick={() => handlePageChange(data.meta.current_page - 1)}
          >
            قبلی
          </Button>
          <span className="text-sm text-text-2">
            صفحه {data.meta.current_page} از {data.meta.last_page}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={data.meta.current_page >= data.meta.last_page}
            onClick={() => handlePageChange(data.meta.current_page + 1)}
          >
            بعدی
          </Button>
        </div>
      )}

      <ForceDeleteProductDialog
        product={forceDeleteTarget}
        open={forceDeleteTarget !== null}
        onOpenChange={(open) => !open && setForceDeleteTarget(null)}
      />
    </div>
  )
}