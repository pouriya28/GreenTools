import { useState } from "react"
import { Link } from "react-router-dom"
import { AlertTriangle, ArrowRight, Loader2, Trash } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/shared/lib/apiError"
import { useTrashedCategories } from "../hooks/useTrashedCategories"
import { useRestoreCategory } from "../hooks/useCategoryMutations"
import { TrashedCategoryCard } from "../components/Trashedcategorycard"
import { ForceDeleteCategoryDialog } from "../components/Forcedeletecategorydialog"
import type { Category } from "../types"

export default function TrashedCategoriesPage() {
  const { data: trashed, isLoading, isError, refetch, isFetching } = useTrashedCategories()
  const restoreMutation = useRestoreCategory()

  const [restoringId, setRestoringId] = useState<number | null>(null)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const [forceDeleteTarget, setForceDeleteTarget] = useState<Category | null>(null)

  async function handleRestore(category: Category) {
    setRestoringId(category.id)
    setRestoreError(null)
    try {
      await restoreMutation.mutateAsync(category.id)
    } catch (err) {
      setRestoreError(getApiErrorMessage(err, "بازگردانی ناموفق بود."))
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Link
          to="/categories"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          aria-label="بازگشت به دسته‌بندی‌ها"
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-text-1">سطل‌زباله دسته‌بندی‌ها</h1>
          <p className="text-sm text-text-2">
            {trashed ? `${trashed.length} مورد حذف‌شده` : "دسته‌بندی‌های حذف‌شده، قابل بازگردانی"}
          </p>
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

      {!isLoading && !isError && trashed && trashed.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-text-2">
          <Trash className="h-8 w-8 opacity-50" />
          <p className="text-sm">سطل‌زباله خالیه.</p>
        </div>
      )}

      {!isLoading && !isError && trashed && trashed.length > 0 && (
        <div className="flex flex-col gap-2">
          {trashed.map((category) => (
            <TrashedCategoryCard
              key={category.id}
              category={category}
              onRestore={handleRestore}
              onForceDeleteRequest={setForceDeleteTarget}
              isRestoring={restoringId === category.id}
            />
          ))}
        </div>
      )}

      <ForceDeleteCategoryDialog
        category={forceDeleteTarget}
        open={forceDeleteTarget !== null}
        onOpenChange={(open) => !open && setForceDeleteTarget(null)}
      />
    </div>
  )
}