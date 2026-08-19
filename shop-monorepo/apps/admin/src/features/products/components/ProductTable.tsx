import { ChevronLeft, ChevronRight, ImageOff, Loader2, PackageOpen, Pencil, Star, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { PaginationMeta } from "@/shared/types/pagination.types"
import type { ProductListItem } from "../types"
import { formatPrice, STOCK_STATUS_BADGE_VARIANT, STOCK_STATUS_LABELS } from "../utils"

interface ProductTableProps {
  products: ProductListItem[]
  meta: PaginationMeta | undefined
  onPageChange: (page: number) => void
  onEdit: (product: ProductListItem) => void
  onDeleteRequest: (product: ProductListItem) => void
  onToggleFeatured: (product: ProductListItem) => void
  togglingFeaturedId: number | null
}

export function ProductTable({
  products,
  meta,
  onPageChange,
  onEdit,
  onDeleteRequest,
  onToggleFeatured,
  togglingFeaturedId,
}: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-text-2">
        <PackageOpen className="h-8 w-8 opacity-50" />
        <p className="text-sm">محصولی یافت نشد.</p>
      </div>
    )
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>محصول</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>دسته‌بندی</TableHead>
              <TableHead>قیمت</TableHead>
              <TableHead>موجودی</TableHead>
              <TableHead>ویژه</TableHead>
              <TableHead className="w-24 text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {product.primary_image ? (
                      <img
                        src={product.primary_image.url}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-lg object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-3 text-text-3">
                        <ImageOff className="h-4 w-4" />
                      </span>
                    )}
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium text-text-1">{product.name}</span>
                      <span className="truncate text-xs text-text-2">{product.slug}</span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="whitespace-nowrap text-xs text-text-2">{product.sku}</TableCell>

                <TableCell className="text-text-2">{product.category.name}</TableCell>

                <TableCell>
                  {product.has_active_discount ? (
                    <div className="flex flex-col">
                      <span className="font-medium text-text-1">{formatPrice(product.final_price)} تومان</span>
                      <span className="text-xs text-text-3 line-through">{formatPrice(product.price)}</span>
                    </div>
                  ) : (
                    <span className="text-text-1">{formatPrice(product.price)} تومان</span>
                  )}
                </TableCell>

                <TableCell>
                  <Badge variant={STOCK_STATUS_BADGE_VARIANT[product.stock_status]}>
                    {STOCK_STATUS_LABELS[product.stock_status]}
                  </Badge>
                </TableCell>

                <TableCell>
                  <button
                    type="button"
                    onClick={() => onToggleFeatured(product)}
                    disabled={togglingFeaturedId === product.id}
                    aria-label={product.is_featured ? "حذف از ویژه‌ها" : "افزودن به ویژه‌ها"}
                    className="rounded p-1 text-text-2 hover:bg-bg-3 disabled:opacity-50"
                  >
                    {togglingFeaturedId === product.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Star className="h-4 w-4" fill={product.is_featured ? "currentColor" : "none"} />
                    )}
                  </button>
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button type="button" variant="ghost" size="icon" aria-label="ویرایش" onClick={() => onEdit(product)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="حذف"
                      className="text-danger hover:bg-danger/10 hover:text-danger"
                      onClick={() => onDeleteRequest(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* موبایل: کارت ساده — برخلاف دسته‌بندی‌ها که ساختار درختیه و سوایش
          داره، لیست محصولات مسطح و صفحه‌بندی‌شده‌ست، سوایش لازم نیست. */}
      <div className="flex flex-col gap-2 sm:hidden">
        {products.map((product) => (
          <div key={product.id} className="flex flex-col gap-3 rounded-xl border border-border bg-bg-1 p-3">
            <div className="flex items-center gap-3">
              {product.primary_image ? (
                <img src={product.primary_image.url} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" loading="lazy" />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-bg-3 text-text-3">
                  <ImageOff className="h-5 w-5" />
                </span>
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium text-text-1">{product.name}</span>
                <span className="truncate text-xs text-text-2">
                  {product.category.name} • {product.sku}
                </span>
                <span className="text-sm text-text-1">{formatPrice(product.final_price)} تومان</span>
              </div>
              <Badge variant={STOCK_STATUS_BADGE_VARIANT[product.stock_status]}>
                {STOCK_STATUS_LABELS[product.stock_status]}
              </Badge>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onToggleFeatured(product)}>
                <Star className="h-4 w-4" fill={product.is_featured ? "currentColor" : "none"} />
                ویژه
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => onEdit(product)}>
                <Pencil className="h-4 w-4" />
                ویرایش
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-danger hover:bg-danger/10 hover:text-danger"
                onClick={() => onDeleteRequest(product)}
              >
                <Trash2 className="h-4 w-4" />
                حذف
              </Button>
            </div>
          </div>
        ))}
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={meta.current_page <= 1}
            onClick={() => onPageChange(meta.current_page - 1)}
            aria-label="صفحه‌ی قبل"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm text-text-2">
            صفحه {meta.current_page} از {meta.last_page}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={meta.current_page >= meta.last_page}
            onClick={() => onPageChange(meta.current_page + 1)}
            aria-label="صفحه‌ی بعد"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  )
}
