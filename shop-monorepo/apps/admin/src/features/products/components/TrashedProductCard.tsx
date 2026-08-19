import { ImageOff, RotateCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ProductListItem } from "../types"

interface TrashedProductCardProps {
  product: ProductListItem
  onRestore: (product: ProductListItem) => void
  onForceDeleteRequest: (product: ProductListItem) => void
  isRestoring: boolean
}

function formatDeletedAt(value: string | null | undefined): string {
  if (!value) return "نامشخص"
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  } catch {
    return value
  }
}

export function TrashedProductCard({ product, onRestore, onForceDeleteRequest, isRestoring }: TrashedProductCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-1 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {product.primary_image ? (
          <img src={product.primary_image.url} alt="" className="h-10 w-10 rounded-lg object-cover opacity-70" loading="lazy" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-3 text-text-3">
            <ImageOff className="h-4 w-4" />
          </span>
        )}
        <div className="flex flex-col">
          <span className="font-medium text-text-1">{product.name}</span>
          <span className="text-xs text-text-2">{product.category.name}</span>
          <span className="text-xs text-text-3">حذف‌شده در {formatDeletedAt(product.deleted_at)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Button type="button" variant="outline" size="sm" onClick={() => onRestore(product)} disabled={isRestoring}>
          <RotateCcw className="h-4 w-4" />
          بازگردانی
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-danger hover:bg-danger/10 hover:text-danger"
          onClick={() => onForceDeleteRequest(product)}
        >
          <Trash2 className="h-4 w-4" />
          حذف قطعی
        </Button>
      </div>
    </div>
  )
}