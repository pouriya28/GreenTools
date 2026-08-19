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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getApiErrorMessage } from "@/shared/lib/apiError"
import type { ProductListItem } from "../types"
import { useForceDeleteProduct } from "../hooks/useProductMutations"

interface ForceDeleteProductDialogProps {
  product: ProductListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ForceDeleteProductDialog({ product, open, onOpenChange }: ForceDeleteProductDialogProps) {
  const forceDeleteMutation = useForceDeleteProduct()
  const [confirmText, setConfirmText] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setConfirmText("")
      setErrorMessage(null)
    }
  }, [open, product?.id])

  const isMatch = product !== null && confirmText.trim() === product.name

  async function handleConfirm(event: MouseEvent) {
    event.preventDefault()
    if (!product || !isMatch) return

    setErrorMessage(null)
    try {
      await forceDeleteMutation.mutateAsync(product.id)
      onOpenChange(false)
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, "حذف قطعی ناموفق بود."))
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !forceDeleteMutation.isPending && onOpenChange(next)}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>حذف قطعی محصول</AlertDialogTitle>
          <AlertDialogDescription>
            این عملیات کاملاً برگشت‌ناپذیره — «{product?.name}» و تمام عکس/ویدیوهاش برای همیشه پاک
            می‌شن. برای تأیید، نام دقیق محصول رو تایپ کن.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-name">
            نام محصول: <span className="font-semibold text-text-1">{product?.name}</span>
          </Label>
          <Input id="confirm-name" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" autoFocus />
        </div>

        {errorMessage && (
          <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={forceDeleteMutation.isPending}>انصراف</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={!isMatch || forceDeleteMutation.isPending}>
            {forceDeleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            حذف قطعی
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}