import { useState } from "react"
import { Link } from "react-router-dom"
import { AlertTriangle, Loader2, Plus, Trash2 } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useCategories } from "../hooks/useCategories"
import { CategoryTable } from "../components/CategoryTable"
import { CategoryFormDialog } from "../components/CategoryFormDialog"
import { DeleteCategoryDialog } from "../components/DeleteCategoryDialog"
import type { Category } from "../types"

export default function CategoriesPage() {
  const { data: categories, isLoading, isError, refetch, isFetching } = useCategories()

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  function handleCreate() {
    setEditingCategory(null)
    setFormDialogOpen(true)
  }

  function handleEdit(category: Category) {
    setEditingCategory(category)
    setFormDialogOpen(true)
  }

  function handleFormOpenChange(open: boolean) {
    setFormDialogOpen(open)
    if (!open) setEditingCategory(null)
  }

  function handleDeleteOpenChange(open: boolean) {
    if (!open) setDeleteTarget(null)
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-1">دسته‌بندی‌ها</h1>
          <p className="text-sm text-text-2">
            {categories ? `${categories.length} دسته‌بندی سطح اول` : "مدیریت دسته‌بندی‌های فروشگاه"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/categories/trash" className={cn(buttonVariants({ variant: "outline" }))}>
            <Trash2 className="h-4 w-4" />
            سطل‌زباله
          </Link>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            افزودن دسته‌بندی
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border py-16 text-text-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          در حال بارگذاری دسته‌بندی‌ها...
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 py-12 text-danger">
          <AlertTriangle className="h-6 w-6" />
          <p className="text-sm">دریافت دسته‌بندی‌ها با خطا مواجه شد.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
            تلاش دوباره
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <CategoryTable
          categories={categories ?? []}
          onEdit={handleEdit}
          onDeleteRequest={setDeleteTarget}
        />
      )}

      <CategoryFormDialog
        open={formDialogOpen}
        onOpenChange={handleFormOpenChange}
        categories={categories ?? []}
        category={editingCategory}
      />

      <DeleteCategoryDialog
        category={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={handleDeleteOpenChange}
      />
    </div>
  )
}