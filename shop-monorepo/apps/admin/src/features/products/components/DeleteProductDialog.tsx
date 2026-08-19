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
import type { ProductListItem } from "../types"
import { useDeleteProduct } from "../hooks/useProductMutations"

interface DeleteProductDialogProps {
  product: ProductListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteProductDialog({ product, open, onOpenChange }: DeleteProductDialogProps) {
  const deleteMutation = useDeleteProduct()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (open) setErrorMessage(null)
  }, [open, product?.id])

  async function handleConfirm(event: MouseEvent) {
    event.preventDefault()
    if (!product) return
    setErrorMessage(null)
    try {
      await deleteMutation.mutateAsync(product.id)
      onOpenChange(false)
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, "حذف محصول ناموفق بود."))
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !deleteMutation.isPending && onOpenChange(next)}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>حذف محصول</AlertDialogTitle>
          <AlertDialogDescription>
            آیا از حذف «{product?.name}» مطمئنی؟ محصول به سطل‌زباله منتقل می‌شه و قابل بازگردانیه.
          </AlertDialogDescription>
        </AlertDialogHeader>

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