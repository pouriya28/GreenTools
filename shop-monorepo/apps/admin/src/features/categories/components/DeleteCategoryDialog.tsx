import { useEffect, useState, type MouseEvent } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getApiErrorMessage } from "@/shared/lib/apiError"
import type { Category } from "../types"
import { useDeleteCategory } from "../hooks/useCategoryMutations"

interface DeleteCategoryDialogProps {
  category: Category | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteCategoryDialog({ category, open, onOpenChange }: DeleteCategoryDialogProps) {
  const deleteMutation = useDeleteCategory()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // با هر بار باز شدن روی یه دسته‌ی جدید، خطای دفعه‌ی قبل رو پاک کن.
  useEffect(() => {
    if (open) setErrorMessage(null)
  }, [open, category?.id])

  const hasChildren = (category?.children?.length ?? 0) > 0

  async function handleConfirm(event: MouseEvent) {
    // AlertDialogAction به‌صورت پیش‌فرض بلافاصله دیالوگ رو می‌بنده؛ چون می‌خوایم
    // در صورت خطا دیالوگ باز بمونه و پیام رو نشون بده، این رفتار رو غیرفعال می‌کنیم.
    event.preventDefault()
    if (!category) return
    setErrorMessage(null)
    try {
      await deleteMutation.mutateAsync(category.id)
      onOpenChange(false)
    } catch (err) {
      // دیالوگ رو باز نگه می‌داریم تا کاربر دلیل شکست حذف رو (403 صلاحیت،
      // یا 422 «دسته‌بندی خالی نیست») ببینه؛ به‌جای بستن بی‌صدا.
      setErrorMessage(getApiErrorMessage(err, "حذف دسته‌بندی ناموفق بود."))
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !deleteMutation.isPending && onOpenChange(next)}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>حذف دسته‌بندی</AlertDialogTitle>
          <AlertDialogDescription>
            آیا از حذف «{category?.name}» مطمئنی؟ این عملیات قابل بازگشت نیست.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasChildren && (
          <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              این دسته‌بندی زیردسته دارد. بسته به قوانین بک‌اند، ممکن است حذف تا خالی نشدن
              زیردسته‌ها انجام نشود.
            </span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>انصراف</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            حذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
