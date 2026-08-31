# Products Feature Source



## features\products\api\productsApi.ts

``ts
import { api } from "@/shared/lib/axios"
import type { PaginatedResponse } from "@/shared/types/pagination.types"
import type {
  Product,
  ProductFilters,
  ProductImage,
  ProductListItem,
  ProductPayload,
  ProductVideo,
  ResourceEnvelope,
} from "../types"

const BASE = "/products/admin"

function toQueryParams(filters: ProductFilters) {
  return {
    search: filters.search || undefined,
    category_id: filters.category_id || undefined,
    is_active: filters.is_active,
    stock_status: filters.stock_status || undefined,
    sort: filters.sort || undefined,
    page: filters.page || 1,
  }
}

export async function fetchProducts(filters: ProductFilters) {
  const { data } = await api.get<PaginatedResponse<ProductListItem>>(BASE, {
    params: toQueryParams(filters),
  })
  return data
}

export async function fetchProduct(id: number) {
  const { data } = await api.get<ResourceEnvelope<Product>>(`${BASE}/${id}`)
  return data.data
}

export async function createProduct(payload: ProductPayload) {
  const { data } = await api.post<ResourceEnvelope<Product>>(BASE, payload)
  return data.data
}

export async function updateProduct(id: number, payload: Partial<ProductPayload>) {
  const { data } = await api.patch<ResourceEnvelope<Product>>(`${BASE}/${id}`, payload)
  return data.data
}

export async function deleteProduct(id: number) {
  await api.delete(`${BASE}/${id}`)
}

export async function toggleFeaturedProduct(id: number) {
  const { data } = await api.patch<ResourceEnvelope<Product>>(`${BASE}/${id}/toggle-featured`)
  return data.data
}

export async function fetchTrashedProducts(page = 1) {
  const { data } = await api.get<PaginatedResponse<ProductListItem>>(`${BASE}/trash`, {
    params: { page },
  })
  return data
}

export async function restoreProduct(id: number) {
  const { data } = await api.post<ResourceEnvelope<Product>>(`${BASE}/${id}/restore`)
  return data.data
}

export async function forceDeleteProduct(id: number) {
  await api.delete(`${BASE}/${id}/force`)
}

// -----------------------------------------------------------------------
// مدیریت عکس/ویدیوی محصول (ProductMediaController)
// نکته: مسیرها و رفتار سرور از routes/api/v1/products.php و
// ProductMediaService.php تأیید شده. محدودیت‌های زیر برای فقط برای پیام
// خطای زودهنگام سمت کلاینت‌ان؛ اعتبارسنجی واقعی و امن سمت سرور انجام می‌شه.
// -----------------------------------------------------------------------

export const MAX_IMAGES_PER_UPLOAD = 10
export const MAX_IMAGE_SIZE_BYTES = 5120 * 1024
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

export const MAX_VIDEOS_PER_PRODUCT = 5
export const MAX_VIDEO_SIZE_BYTES = 51200 * 1024
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"]

export type VideoSourceType = "upload" | "youtube" | "aparat" | "external"

export interface StoreProductVideoPayload {
  source_type: VideoSourceType
  title?: string | null
  external_url?: string | null
  video?: File | null
}

export async function storeProductImages(productId: number, files: File[], altTexts: string[] = []) {
  const formData = new FormData()
  files.forEach((file) => formData.append("images[]", file))
  files.forEach((_file, index) => formData.append("alt_texts[]", altTexts[index] ?? ""))

  const { data } = await api.post<ResourceEnvelope<ProductImage[]>>(`${BASE}/${productId}/images`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data.data
}

export async function setPrimaryProductImage(productId: number, imageId: number) {
  await api.patch(`${BASE}/${productId}/images/${imageId}/primary`)
}

export async function deleteProductImage(productId: number, imageId: number) {
  await api.delete(`${BASE}/${productId}/images/${imageId}`)
}

export async function storeProductVideo(productId: number, payload: StoreProductVideoPayload) {
  if (payload.source_type === "upload") {
    const formData = new FormData()
    formData.append("source_type", payload.source_type)
    if (payload.title) formData.append("title", payload.title)
    if (payload.video) formData.append("video", payload.video)

    const { data } = await api.post<ResourceEnvelope<ProductVideo>>(`${BASE}/${productId}/videos`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return data.data
  }

  const { data } = await api.post<ResourceEnvelope<ProductVideo>>(`${BASE}/${productId}/videos`, {
    source_type: payload.source_type,
    title: payload.title || null,
    external_url: payload.external_url || null,
  })
  return data.data
}

export async function deleteProductVideo(productId: number, videoId: number) {
  await api.delete(`${BASE}/${productId}/videos/${videoId}`)
}

``


## features\products\components\DeleteProductDialog.tsx

``tsx
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
``


## features\products\components\ForceDeleteProductDialog.tsx

``tsx
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
``


## features\products\components\form\ProductBasicInfoFields.tsx

``tsx
import { Controller, type UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ProductFormValues } from "../../schema"
import type { CategoryOption } from "../../utils"

interface ProductBasicInfoFieldsProps {
  form: UseFormReturn<ProductFormValues>
  categoryOptions: CategoryOption[]
}

export function ProductBasicInfoFields({ form, categoryOptions }: ProductBasicInfoFieldsProps) {
  const { register, control, formState } = form

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">نام محصول</Label>
        <Input id="name" maxLength={200} autoFocus {...register("name")} />
        {formState.errors.name && <p className="text-xs text-danger">{formState.errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sku">SKU(اختیاری)</Label>
          <Input id="sku" maxLength={64} placeholder="خالی بگذارید تا خودکار ساخته شود" {...register("sku")} />
          {formState.errors.sku && <p className="text-xs text-danger">{formState.errors.sku.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category_id">دسته‌بندی</Label>
          <Controller
            control={control}
            name="category_id"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : undefined}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <SelectTrigger id="category_id">
                  <SelectValue placeholder="انتخاب دسته‌بندی" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {"\u2014 ".repeat(option.depth)}
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {formState.errors.category_id && (
            <p className="text-xs text-danger">{formState.errors.category_id.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="short_description">توضیح کوتاه</Label>
        <Textarea id="short_description" rows={2} maxLength={500} {...register("short_description")} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">توضیحات کامل</Label>
        <Textarea id="description" rows={5} maxLength={20000} {...register("description")} />
      </div>
    </div>
  )
}

``


## features\products\components\form\ProductInventoryFields.tsx

``tsx
import { Controller, type UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ProductFormValues } from "../../schema"

interface ProductInventoryFieldsProps {
  form: UseFormReturn<ProductFormValues>
}

export function ProductInventoryFields({ form }: ProductInventoryFieldsProps) {
  const { register, control, formState } = form

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stock_quantity">موجودی انبار</Label>
          <Input id="stock_quantity" type="number" min={0} {...register("stock_quantity", { valueAsNumber: true })} />
          {formState.errors.stock_quantity && (
            <p className="text-xs text-danger">{formState.errors.stock_quantity.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="weight_grams">وزن (گرم)</Label>
          <Input id="weight_grams" type="number" min={0} {...register("weight_grams", { valueAsNumber: true })} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stock_status">وضعیت موجودی</Label>
        <Controller
          control={control}
          name="stock_status"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="stock_status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_stock">موجود</SelectItem>
                <SelectItem value="out_of_stock">ناموجود</SelectItem>
                <SelectItem value="preorder">پیش‌سفارش</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
        <Label htmlFor="is_active">فعال باشد</Label>
        <Controller
          control={control}
          name="is_active"
          render={({ field }) => <Switch id="is_active" checked={field.value} onCheckedChange={field.onChange} />}
        />
      </div>
    </div>
  )
}

``


## features\products\components\form\ProductPricingFields.tsx

``tsx
import { Controller, type UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateTimePicker } from "@/shared/components/date-picker/DateTimePicker"
import { formatPrice } from "../../utils"
import type { ProductFormValues } from "../../schema"

interface ProductPricingFieldsProps {
  form: UseFormReturn<ProductFormValues>
  /** قیمت فعلی محصول به تومان (فقط در حالت ویرایش) — فقط برای نمایش، محاسبه‌شده توسط بک‌اند. */
  currentTomanPrice?: number | null
}

export function ProductPricingFields({ form, currentTomanPrice }: ProductPricingFieldsProps) {
  const { register, control, formState, watch } = form
  const discountType = watch("discount_type")

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="price_usd">قیمت (دلار)</Label>
        <Input id="price_usd" type="number" min={0.01} step={0.01} {...register("price_usd", { valueAsNumber: true })} />
        {formState.errors.price_usd && <p className="text-xs text-danger">{formState.errors.price_usd.message}</p>}
        {currentTomanPrice != null && (
          <p className="text-xs text-text-3">
            قیمت فعلی به تومان: {formatPrice(currentTomanPrice)} — با نرخ ارز روز و بعد از ذخیره دوباره محاسبه می‌شود.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="discount_type">نوع تخفیف</Label>
          <Controller
            control={control}
            name="discount_type"
            render={({ field }) => (
              <Select value={field.value ?? "none"} onValueChange={(value) => field.onChange(value === "none" ? null : value)}>
                <SelectTrigger id="discount_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون تخفیف</SelectItem>
                  <SelectItem value="percent">درصدی</SelectItem>
                  <SelectItem value="fixed">مبلف ثابت (تومان)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {discountType && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="discount_value">
              مقدار تخفیف {discountType === "percent" ? "(%)" : "(تومان)"}
            </Label>
            <Input id="discount_value" type="number" min={0} {...register("discount_value", { valueAsNumber: true })} />
            {formState.errors.discount_value && (
              <p className="text-xs text-danger">{formState.errors.discount_value.message}</p>
            )}
          </div>
        )}
      </div>

      {discountType && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="discount_starts_at">شروع تخفیف</Label>
            <Controller
              control={control}
              name="discount_starts_at"
              render={({ field }) => (
                <DateTimePicker
                  id="discount_starts_at"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  placeholder="انتخاب زمان شروع"
                />
              )}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="discount_ends_at">پایان تخفیف</Label>
            <Controller
              control={control}
              name="discount_ends_at"
              render={({ field }) => (
                <DateTimePicker
                  id="discount_ends_at"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  placeholder="انتخاب زمان پایان"
                />
              )}
            />
            {formState.errors.discount_ends_at && (
              <p className="text-xs text-danger">{formState.errors.discount_ends_at.message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

``


## features\products\components\form\ProductSeoFields.tsx

``tsx
import type { UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ProductFormValues } from "../../schema"

interface ProductSeoFieldsProps {
  form: UseFormReturn<ProductFormValues>
}

export function ProductSeoFields({ form }: ProductSeoFieldsProps) {
  const { register } = form

  return (
    <details className="rounded-md border border-border px-3 py-2">
      <summary className="cursor-pointer text-sm font-medium text-text-2">تنزیمات سئو (اختیاری)</summary>
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="meta_title">عنوان متا</Label>
          <Input id="meta_title" maxLength={180} {...register("meta_title")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="meta_description">توضیح متا</Label>
          <Textarea id="meta_description" rows={2} maxLength={300} {...register("meta_description")} />
        </div>
      </div>
    </details>
  )
}

``


## features\products\components\media\ProductImageGrid.tsx

``tsx
import { useRef, useState } from "react"
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGES_PER_UPLOAD,
  MAX_IMAGE_SIZE_BYTES,
} from "../../api/productsApi"
import {
  useDeleteProductImage,
  useSetPrimaryProductImage,
  useUploadProductImages,
} from "../../hooks/useProductMediaMutations"
import type { ProductImage } from "../../types"

interface ProductImageGridProps {
  productId: number
  images: ProductImage[]
}

function formatSizeError(fileName: string) {
  return `"${fileName}" بزرگ‌تر از ۵ مگابایت است و آپلود نمی‌شود.`
}

export function ProductImageGrid({ productId, images }: ProductImageGridProps) {
  const [localError, setLocalError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useUploadProductImages(productId)
  const primaryMutation = useSetPrimaryProductImage(productId)
  const deleteMutation = useDeleteProductImage(productId)

  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order)

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList)
    setLocalError(null)

    if (files.length > MAX_IMAGES_PER_UPLOAD) {
      setLocalError(`در هر بار حداکثر ${MAX_IMAGES_PER_UPLOAD} عکس می‌توانید اضافه کنید.`)
      if (inputRef.current) inputRef.current.value = ""
      return
    }

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setLocalError(`فرمت "${file.name}" مجاز نیست. فقط JPEG، PNG یا WebP.`)
        if (inputRef.current) inputRef.current.value = ""
        return
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setLocalError(formatSizeError(file.name))
        if (inputRef.current) inputRef.current.value = ""
        return
      }
    }

    // الف متن هر عکس را از روی نام فایل (بدون پسوند) پیش‌فرض پر می‌کنیم؛ ادمین می‌تواند بعداً از روی تکمه‌ی UI ویرایش کند.
    const altTexts = files.map((file) => file.name.replace(/\.[^/.]+$/, ""))

    uploadMutation.mutate(
      { files, altTexts },
      {
        onError: () => setLocalError("آپلود عکس‌ها ناموفق بود."),
      },
    )
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text-1">عکس‌های محصول</p>
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploadMutation.isPending}>
          {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          افزودن عکس
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={(event) => handleFilesSelected(event.target.files)}
        />
      </div>

      {localError && <p className="text-xs text-danger">{localError}</p>}

      {sortedImages.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-text-2">
          هنوز عکسی اضافه نشده.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {sortedImages.map((image) => (
            <div key={image.id} className="group relative overflow-hidden rounded-md border border-border">
              <img src={image.url} alt={image.alt_text ?? ""} className="h-24 w-full object-cover" />

              <button
                type="button"
                title="تصویر شاخص"
                disabled={image.is_primary || primaryMutation.isPending}
                onClick={() => primaryMutation.mutate(image.id)}
                className={`absolute top-1 right-1 rounded-full p-1 transition-colors ${
                  image.is_primary ? "bg-warning text-warning-foreground" : "bg-bg-1/80 text-text-2 hover:text-warning"
                }`}
              >
                <Star className="h-4 w-4" fill={image.is_primary ? "currentColor" : "none"} />
              </button>

              <button
                type="button"
                title="حذف عکس"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(image.id)}
                className="absolute bottom-1 left-1 rounded-full bg-bg-1/80 p-1 text-danger opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {image.is_primary && (
                <span className="absolute bottom-1 right-1 rounded bg-warning px-1.5 py-0.5 text-[10px] font-medium text-warning-foreground">
                  شاخص
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

``


## features\products\components\media\ProductMediaSection.tsx

``tsx
import { ProductImageGrid } from "./ProductImageGrid"
import { ProductVideoList } from "./ProductVideoList"
import type { ProductImage, ProductVideo } from "../../types"

interface ProductMediaSectionProps {
  productId: number
  images: ProductImage[]
  videos: ProductVideo[]
}

// بخش مدیریت عکس/ویدیو. فقط وقتی رندر می‌شه که محصول واقعاً در دیتابیس وتایید شده
// باشه (productId موجود باشه)؛ یعنی اول فرم اصلی محصول با ولدیشن‌هاش باید با
// موفقیت ذخیره شده باشه، بعد عکس/ویدیو اضافه می‌شه — دقیقاً مطابق خواست کاربر.
export function ProductMediaSection({ productId, images, videos }: ProductMediaSectionProps) {
  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-bg-2/40 p-3">
      <p className="text-sm font-semibold text-text-1">مدیریت عکس و ویدیو</p>
      <ProductImageGrid productId={productId} images={images} />
      <div className="h-px bg-border" />
      <ProductVideoList productId={productId} videos={videos} />
    </div>
  )
}

``


## features\products\components\media\ProductVideoList.tsx

``tsx
import { useState } from "react"
import { Loader2, Trash2, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ALLOWED_VIDEO_TYPES,
  MAX_VIDEOS_PER_PRODUCT,
  MAX_VIDEO_SIZE_BYTES,
  type VideoSourceType,
} from "../../api/productsApi"
import { useDeleteProductVideo, useUploadProductVideo } from "../../hooks/useProductMediaMutations"
import type { ProductVideo } from "../../types"

interface ProductVideoListProps {
  productId: number
  videos: ProductVideo[]
}

const SOURCE_LABELS: Record<VideoSourceType, string> = {
  upload: "اپلود فایل",
  youtube: "یوتیوب",
  aparat: "اپارات",
  external: "لینک خارجی",
}

export function ProductVideoList({ productId, videos }: ProductVideoListProps) {
  const [sourceType, setSourceType] = useState<VideoSourceType>("youtube")
  const [title, setTitle] = useState("")
  const [externalUrl, setExternalUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const uploadMutation = useUploadProductVideo(productId)
  const deleteMutation = useDeleteProductVideo(productId)

  const sortedVideos = [...videos].sort((a, b) => a.sort_order - b.sort_order)
  const reachedLimit = sortedVideos.length >= MAX_VIDEOS_PER_PRODUCT

  function resetForm() {
    setTitle("")
    setExternalUrl("")
    setFile(null)
  }

  function handleFileChange(selected: File | null) {
    setFormError(null)
    if (!selected) {
      setFile(null)
      return
    }
    if (!ALLOWED_VIDEO_TYPES.includes(selected.type)) {
      setFormError("فرمت ویدیو مجاز نیست. فقط MP4، WebM یا OGG.")
      setFile(null)
      return
    }
    if (selected.size > MAX_VIDEO_SIZE_BYTES) {
      setFormError("حجم ویدیو بزرگ‌تر از ۵۰ مگابایت است.")
      setFile(null)
      return
    }
    setFile(selected)
  }

  function handleSubmit() {
    setFormError(null)

    if (reachedLimit) {
      setFormError(`حداکثر ${MAX_VIDEOS_PER_PRODUCT} ویدیو برای هر محصول مجاز است.`)
      return
    }

    if (sourceType === "upload") {
      if (!file) {
        setFormError("اول یک فایل ویدیوی انتخاب کن.")
        return
      }
      uploadMutation.mutate(
        { source_type: "upload", title: title.trim() || null, video: file },
        {
          onSuccess: () => resetForm(),
          onError: () => setFormError("افزودن ویدیو ناموفق بود."),
        },
      )
      return
    }

    if (!externalUrl.trim()) {
      setFormError("لینک ویدیو رو وارد کن.")
      return
    }

    uploadMutation.mutate(
      { source_type: sourceType, title: title.trim() || null, external_url: externalUrl.trim() },
      {
        onSuccess: () => resetForm(),
        onError: () => setFormError("افزودن ویدیو ناموفق بود."),
      },
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-text-1">ویدیوهای محصول</p>

      {sortedVideos.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-text-2">
          هنوز ویدیوی اضافه نشده.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sortedVideos.map((video) => (
            <li key={video.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <Video className="h-4 w-4 shrink-0 text-text-2" />
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm text-text-1">{video.title || video.url}</span>
                  <span className="text-xs text-text-2">{SOURCE_LABELS[video.source_type]}</span>
                </div>
              </div>
              <button
                type="button"
                title="حذف ویدیو"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(video.id)}
                className="shrink-0 rounded-full p-1 text-danger hover:bg-danger/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!reachedLimit && (
        <div className="flex flex-col gap-2 rounded-md border border-border p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="video_source_type">منبع</Label>
              <Select
                value={sourceType}
                onValueChange={(value) => {
                  setSourceType(value as VideoSourceType)
                  setFormError(null)
                }}
              >
                <SelectTrigger id="video_source_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">یوتیوب</SelectItem>
                  <SelectItem value="aparat">اپارات</SelectItem>
                  <SelectItem value="external">لینک خارجی</SelectItem>
                  <SelectItem value="upload">اپلود فایل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="video_title">عنوان (اختیاری)</Label>
              <Input id="video_title" value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
          </div>

          {sourceType === "upload" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="video_file">فایل ویدیو (حداکثر ۵۰ مگابایت)</Label>
              <input
                id="video_file"
                type="file"
                accept={ALLOWED_VIDEO_TYPES.join(",")}
                onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                className="text-sm text-text-2"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="video_url">لینک ویدیو</Label>
              <Input
                id="video_url"
                placeholder="https://..."
                value={externalUrl}
                onChange={(event) => setExternalUrl(event.target.value)}
              />
            </div>
          )}

          {formError && <p className="text-xs text-danger">{formError}</p>}

          <Button type="button" size="sm" onClick={handleSubmit} disabled={uploadMutation.isPending} className="self-start">
            {uploadMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            افزودن ویدیو
          </Button>
        </div>
      )}
    </div>
  )
}

``


## features\products\components\ProductFilters.tsx

``tsx
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

``


## features\products\components\ProductFormDialog.tsx

``tsx
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { applyValidationErrors, getApiErrorMessage } from "@/shared/lib/apiError"
import { useCategories } from "@/features/categories/hooks/useCategories"
import { productSchema, type ProductFormValues } from "../schema"
import type { Product, ProductPayload } from "../types"
import { useProduct } from "../hooks/useProduct"
import { useCreateProduct, useUpdateProduct } from "../hooks/useProductMutations"
import { buildCategoryOptions } from "../utils"
import { ProductBasicInfoFields } from "./form/ProductBasicInfoFields"
import { ProductPricingFields } from "./form/ProductPricingFields"
import { ProductInventoryFields } from "./form/ProductInventoryFields"
import { ProductSeoFields } from "./form/ProductSeoFields"
import { ProductMediaSection } from "./media/ProductMediaSection"

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** id محصول در حالت ویرایش; null یعنی حالت ساخت محصول جدید. */
  productId?: number | null
}

function buildDefaultValues(product?: Product | null): ProductFormValues {
  return {
    category_id: product?.category?.id ?? (undefined as unknown as number),
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    short_description: product?.short_description ?? "",
    description: product?.description ?? "",
    // قبلاً از product?.price (ریال) پر می‌شد؛ الان از price_usd چون بک‌اند فقط
    // همین فیلد را در UpdateProductRequest قبول می‌کند.
    price_usd: product?.price_usd ?? 0,
    discount_type: product?.discount_type ?? null,
    discount_value: product?.discount_value ?? null,
    // قبلاً همیشه null می‌موند (بک‌اند این فیلد را برنمی‌گردوند)؛ الان که
    // ProductResource اصلاح شد، مقدار واقعی محصول را می‌پر کنیم.
    discount_starts_at: product?.discount_starts_at ?? null,
    discount_ends_at: product?.discount_ends_at ?? null,
    stock_quantity: product?.stock_quantity ?? 0,
    stock_status: product?.stock_status ?? "in_stock",
    weight_grams: product?.weight_grams ?? null,
    is_active: product?.is_active ?? true,
    meta_title: product?.meta_title ?? "",
    meta_description: product?.meta_description ?? "",
  }
}

export function ProductFormDialog({ open, onOpenChange, productId = null }: ProductFormDialogProps) {
  const isEdit = productId !== null
  const [formError, setFormError] = useState<string | null>(null)
  // وقتی در حالت ساخت، اولین بار که فرم با موفقیت submit می‌شه، id محصول تازه ساخته شده رو
  // اینجا نگه می‌داریم تا بدون بستن دیالوگ، بخش مدیریت عکس/ویدیو رو نمایش بدهیم.
  const [createdProductId, setCreatedProductId] = useState<number | null>(null)

  // همین productId (اگر واقعاً در حال ویرایش هستیم) یا همون محصولی که همین الان در همین
  // حین باز بودن دیالوگ ساختیم.
  const effectiveProductId = productId ?? createdProductId
  const isPersisted = effectiveProductId !== null

  const { data: product, isLoading: isLoadingProduct } = useProduct(open ? effectiveProductId : null)
  const { data: categories } = useCategories()
  const categoryOptions = buildCategoryOptions(categories ?? [])

  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: buildDefaultValues(null),
  })

  // فیکس: قبلاً این افکت هر بار که `product` (داده‌ی query) توسط مرجع جدید می‌شد، دوباره
  // form.reset می‌کرد. با اضافه شدن بخش مدیریت عکس/ویدیو، هر mutation روی عکس/ویدیو
  // کویری دیتایل محصول رو invalidate می‌کرد و باعث رفرش تازه می‌شد؛ اگر هر بار
  // form.reset فرا می‌خوند، هر تویی یا تغییر قیمتی که کاربر روی فیلدهای دیگر انجام داده پاک
  // می‌شد. برای همین فقط یک بار به ازای هر جلسه‌ی باز بودن دیالوگ ریست می‌کنیم.
  const initializedKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!open) {
      initializedKeyRef.current = null
      return
    }

    const key = isEdit ? `edit-${productId}` : "create"
    if (initializedKeyRef.current === key) return
    if (isEdit && !product) return // هنوز محصول لود نشده

    setFormError(null)
    form.reset(buildDefaultValues(isEdit ? product ?? null : null))
    initializedKeyRef.current = key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product, isEdit, productId])

  useEffect(() => {
    if (!open) setCreatedProductId(null)
  }, [open])

  async function onSubmit(values: ProductFormValues) {
    setFormError(null)

    const payload: ProductPayload = {
      category_id: values.category_id,
      name: values.name.trim(),
      sku: values.sku.trim(),
      short_description: values.short_description?.trim() || null,
      description: values.description?.trim() || null,
      price_usd: values.price_usd,
      discount_type: values.discount_type || null,
      discount_value: values.discount_type ? (values.discount_value ?? null) : null,
      discount_starts_at: values.discount_type ? values.discount_starts_at || null : null,
      discount_ends_at: values.discount_type ? values.discount_ends_at || null : null,
      stock_quantity: values.stock_quantity,
      stock_status: values.stock_status,
      weight_grams: values.weight_grams ?? null,
      is_active: values.is_active,
      meta_title: values.meta_title?.trim() || null,
      meta_description: values.meta_description?.trim() || null,
    }

    try {
      if (effectiveProductId) {
        await updateMutation.mutateAsync({ id: effectiveProductId, payload })
        // اگر از اول دیالوگ در حالت ویرایش باز شده باشه (isEdit)، مطابق رفتار قبلی بسته
        // می‌شه. اگر همین الان محصول رو ساختیم (create-then-attach-media flow)، دیالوگ رو باز
        // نگه می‌داریم تا کاربر بتونه عکس/ویدیو اضافه کنه و خودش با دکمه‌ی «بستن» تمومش کنه.
        if (isEdit) {
          onOpenChange(false)
        }
      } else {
        const created = await createMutation.mutateAsync(payload)
        setCreatedProductId(created.id)
      }
    } catch (err) {
      const handled = applyValidationErrors<ProductFormValues>(err, form.setError)
      if (!handled) {
        setFormError(getApiErrorMessage(err, isEdit ? "ویرایش محصول ناموفق بود." : "ساخت محصول ناموفق بود."))
      }
    }
  }

  const showLoadingState = isEdit && isLoadingProduct

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-border bg-bg-1" dir="rtl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "ویرایش محصول" : "محصول جدید"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `در حال ویرایش «${product?.name ?? "..."}»`
              : isPersisted
                ? "محصول ساخته شد. حالا می‌تونی عکس/ویدیو اضافه کنی یا ویرایش‌های بیشتر اعمال کنی."
                : "اطلاعات محصول جدید رو وارد کن. بعد از ثبت اولیه، می‌تونی عکس/ویدیو اضافه کنی."}
          </DialogDescription>
        </DialogHeader>

        {showLoadingState ? (
          <div className="flex items-center justify-center gap-2 py-12 text-text-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            در حال بارگذاری اطلاعات محصول...
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {formError && (
              <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <ProductBasicInfoFields form={form} categoryOptions={categoryOptions} />
            <ProductPricingFields form={form} currentTomanPrice={isPersisted ? product?.price ?? null : null} />
            <ProductInventoryFields form={form} />
            <ProductSeoFields form={form} />

            {/* بخش مدیریت عکس/ویدیو: فقط بعد از اینکه محصول واقعاً ذخیره شد (ویرایش یا همین
                الان ساخته شد) نمایش داده می‌شه؛ قبل از اون media رو توی فرم کاری می‌کرد ولی پشتوانه
                محصولی که هنوز id ندارد وجود ندارد. */}
            {isPersisted && effectiveProductId && (
              <ProductMediaSection
                productId={effectiveProductId}
                images={product?.images ?? []}
                videos={product?.videos ?? []}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                {isPersisted ? "بستن" : "انصراف"}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isPersisted ? "ذخیره‌ی تقییرات" : "ساخت محصول و افزودن عکس/ویدیو"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

``


## features\products\components\ProductTable.tsx

``tsx
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

``


## features\products\components\TrashedProductCard.tsx

``tsx
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
``


## features\products\hooks\useProduct.ts

``ts
import { useQuery } from "@tanstack/react-query"
import { fetchProduct } from "../api/productsApi"

export function useProduct(id: number | null) {
  return useQuery({
    queryKey: ["products", "detail", id],
    queryFn: () => fetchProduct(id as number),
    enabled: id !== null,
  })
}
``


## features\products\hooks\useProductMediaMutations.ts

``ts
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import {
  deleteProductImage,
  deleteProductVideo,
  setPrimaryProductImage,
  storeProductImages,
  storeProductVideo,
  type StoreProductVideoPayload,
} from "../api/productsApi"

function invalidateProductDetail(queryClient: QueryClient, productId: number) {
  queryClient.invalidateQueries({ queryKey: ["products", "detail", productId] })
}

export function useUploadProductImages(productId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ files, altTexts }: { files: File[]; altTexts?: string[] }) =>
      storeProductImages(productId, files, altTexts ?? []),
    onSuccess: () => invalidateProductDetail(queryClient, productId),
  })
}

export function useSetPrimaryProductImage(productId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (imageId: number) => setPrimaryProductImage(productId, imageId),
    onSuccess: () => invalidateProductDetail(queryClient, productId),
  })
}

export function useDeleteProductImage(productId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (imageId: number) => deleteProductImage(productId, imageId),
    onSuccess: () => invalidateProductDetail(queryClient, productId),
  })
}

export function useUploadProductVideo(productId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: StoreProductVideoPayload) => storeProductVideo(productId, payload),
    onSuccess: () => invalidateProductDetail(queryClient, productId),
  })
}

export function useDeleteProductVideo(productId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (videoId: number) => deleteProductVideo(productId, videoId),
    onSuccess: () => invalidateProductDetail(queryClient, productId),
  })
}

``


## features\products\hooks\useProductMutations.ts

``ts
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleFeaturedProduct,
  restoreProduct,
  forceDeleteProduct,
} from "../api/productsApi"
import type { ProductPayload } from "../types"

// چون کلید لیست شامل فیلترهاست (["products", filters])، به‌جای invalidate
// دقیق، هر query ای که با "products" شروع بشه (بجز trash و detail) رو
// invalidate می‌کنیم.
function invalidateProductLists(queryClient: QueryClient) {
  queryClient.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === "products" &&
      query.queryKey[1] !== "trash" &&
      query.queryKey[1] !== "detail",
  })
}

function invalidateTrash(queryClient: QueryClient) {
  queryClient.invalidateQueries({
    predicate: (query) => query.queryKey[0] === "products" && query.queryKey[1] === "trash",
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProductPayload) => createProduct(payload),
    onSuccess: () => invalidateProductLists(queryClient),
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ProductPayload> }) =>
      updateProduct(id, payload),
    onSuccess: (_data, variables) => {
      invalidateProductLists(queryClient)
      queryClient.invalidateQueries({ queryKey: ["products", "detail", variables.id] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      invalidateProductLists(queryClient)
      invalidateTrash(queryClient)
    },
  })
}

export function useToggleFeaturedProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => toggleFeaturedProduct(id),
    onSuccess: () => invalidateProductLists(queryClient),
  })
}

export function useRestoreProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => restoreProduct(id),
    onSuccess: () => {
      invalidateProductLists(queryClient)
      invalidateTrash(queryClient)
    },
  })
}

export function useForceDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => forceDeleteProduct(id),
    onSuccess: () => invalidateTrash(queryClient),
  })
}
``


## features\products\hooks\useProducts.ts

``ts
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { fetchProducts } from "../api/productsApi"
import type { ProductFilters } from "../types"

export function productsQueryKey(filters: ProductFilters) {
  return ["products", filters] as const
}

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: productsQueryKey(filters),
    queryFn: () => fetchProducts(filters),
    // صفحه‌ی قبلی رو حین رفتن به صفحه‌ی بعد نگه می‌داره تا لیست چشمک نزنه
    placeholderData: keepPreviousData,
  })
}
``


## features\products\hooks\useTrashedProducts.ts

``ts
import { useQuery } from "@tanstack/react-query"
import { fetchTrashedProducts } from "../api/productsApi"

export function trashedProductsQueryKey(page: number) {
  return ["products", "trash", page] as const
}

export function useTrashedProducts(page: number) {
  return useQuery({
    queryKey: trashedProductsQueryKey(page),
    queryFn: () => fetchTrashedProducts(page),
  })
}
``


## features\products\pages\ProductsPage.tsx

``tsx
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

``


## features\products\pages\TrashedProductsPage.tsx

``tsx
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
``


## features\products\schema.ts

``ts
import { z } from "zod"

export const productSchema = z
  .object({
    category_id: z.number({ required_error: "دسته‌بندی را انتخاب کنید" }),
    name: z.string().min(2, "نام باید داقل ۲ کاراکتر باشد").max(200),
    sku: z
      .string()
      .max(64)
      .regex(/^[a-zA-Z0-9_-]*$/, "SKU فقط می‌تواند شامل حروف انگلیسی، عدد، خط‌تیره و آندرلاین باشد"),
    short_description: z.string().max(500).nullable().optional(),
    description: z.string().max(20000).nullable().optional(),

    // قیمت حالا به دلار وارد می‌شه (نه تومان)؛ محدوده بر اساس رنج معقول
    // قیمت دلاری محصولات تنظیم شده، نه رنج قبلی ریالی.
    price_usd: z.number().min(0.01, "قیمت باید حداقل ۰.۰۱ دلار باشد").max(999999.99),
    discount_type: z.enum(["percent", "fixed"]).nullable().optional(),
    discount_value: z.number().min(0).nullable().optional(),
    discount_starts_at: z.string().nullable().optional(),
    discount_ends_at: z.string().nullable().optional(),

    stock_quantity: z.number().int().min(0).max(1000000),
    stock_status: z.enum(["in_stock", "out_of_stock", "preorder"]),
    weight_grams: z.number().int().min(0).max(1000000).nullable().optional(),

    is_active: z.boolean(),
    meta_title: z.string().max(180).nullable().optional(),
    meta_description: z.string().max(300).nullable().optional(),
  })
  // نکته‌ی مهم: قانون قبلی «تخفیف ثابت ≤ قیمت» حذف شد، چون price_usd الان
  // دلاریه ولی discount_type=fixed طبق منطق فعلی بک‌اند به تومان حساب می‌شه
  // و مقایسه‌ی مستقیم این دو عدد دیگه معنی نداره و فرم رو اشتباه رد می‌کرد. فقط
  // قانون درصد ≤۱۰۰ و ترتیب تاریخ‌ها باقی مونده. اگر بک‌اند برای تخفیف ثابت
  // واحد دلار رو هم قبول می‌کنه، بگو تا این قانون رو با واحد درست برگردونم.
  .superRefine((data, ctx) => {
    if (!data.discount_type) return

    if (data.discount_value === null || data.discount_value === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discount_value"],
        message: "مقدار تخفیف را وارد کنید",
      })
      return
    }
    if (data.discount_type === "percent" && data.discount_value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discount_value"],
        message: "درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد",
      })
    }
    if (data.discount_starts_at && data.discount_ends_at) {
      if (new Date(data.discount_ends_at) <= new Date(data.discount_starts_at)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["discount_ends_at"],
          message: "تاریخ پایان تخفیف باید بعد از تاریخ شروع باشد",
        })
      }
    }
  })

export type ProductFormValues = z.infer<typeof productSchema>

``


## features\products\types.ts

``ts
import type { Category } from "@/features/categories/types"

export type DiscountType = "percent" | "fixed"
export type StockStatus = "in_stock" | "out_of_stock" | "preorder"

export interface ProductImage {
  id: number
  url: string
  alt_text: string | null
  is_primary: boolean
  sort_order: number
}

export interface ProductVideo {
  id: number
  source_type: "upload" | "youtube" | "aparat" | "external"
  url: string
  external_id: string | null
  thumbnail_url: string | null
  title: string | null
  sort_order: number
}

export interface ProductCategorySummary {
  id: number
  name: string
  slug: string
}

// شکل کامل، خروجی ProductResource — برای دیالوگ ویرایش
export interface Product {
  id: number
  name: string
  slug: string
  sku: string
  short_description: string | null
  description: string | null

  // قیمت نهایی به تومان (ستون price_toman در بک‌اند) — همون چیزی که همه‌جای
  // سایت به کاربر نهایی نمایش داده می‌شه.
  price: number
  // قیمت مرجع به دلار؛ ادمین این فیلد رو مستقیم ویرایش می‌کنه و بک‌اند بر
  // اساس نرخ ارز روز، price (تومان) رو از روی این محاسبه می‌کنه.
  // نکته: قبلاً ProductResource این فیلد رو برنمی‌گردوند (باگ) — در همین
  // بازبینی اصلاح شد.
  price_usd: number
  final_price: number
  discount_percentage: number | null
  has_active_discount: boolean
  discount_type: DiscountType | null
  discount_value: number | null
  // نکته: قبلاً ProductResource فقط discount_ends_at رو برمی‌گردوند و
  // discount_starts_at همیشه گم می‌شد (باعث می‌شد هر ویرایش، تاریخ شروع
  // تخفیف رو خالی کنه). در همین بازبینی به ProductResource اضافه شد.
  discount_starts_at: string | null
  discount_ends_at: string | null

  stock_quantity: number
  stock_status: StockStatus
  weight_grams: number | null

  is_active: boolean
  is_featured: boolean
  views_count: number
  purchases_count: number
  likes_count: number

  category: Category
  images: ProductImage[]
  videos: ProductVideo[]

  meta_title: string | null
  meta_description: string | null
  created_at: string | null
  updated_at: string | null
}

// شکل خلاصه، خروجی ProductListResource — برای جدول/کارت لیست
export interface ProductListItem {
  id: number
  name: string
  slug: string
  // قبلاً در ProductListResource برنمی‌گشت (باگ) — در همین بازبینی اضافه شد.
  sku: string
  short_description: string | null
  price: number
  final_price: number
  discount_percentage: number | null
  has_active_discount: boolean
  stock_status: StockStatus
  is_featured: boolean
  purchases_count: number
  created_at: string | null
  deleted_at?: string | null
  category: ProductCategorySummary
  primary_image: ProductImage | null
}

// دقیقاً منطبق با StoreProductRequest/UpdateProductRequest
export interface ProductPayload {
  category_id: number
  name: string
  sku?: string | null
  short_description?: string | null
  description?: string | null

  // قبلاً price (تومان) مستقیم ارسال می‌شد؛ الان بک‌اند price_usd می‌گیره
  // و خودش تومان رو بر اساس نرخ روز حساب می‌کنه.
  price_usd: number
  discount_type?: DiscountType | null
  discount_value?: number | null
  discount_starts_at?: string | null
  discount_ends_at?: string | null

  stock_quantity: number
  stock_status: StockStatus
  weight_grams?: number | null

  is_active?: boolean
  meta_title?: string | null
  meta_description?: string | null
}

export interface ProductFilters {
  search?: string
  category_id?: number
  is_active?: boolean
  stock_status?: StockStatus
  sort?: "newest" | "oldest" | "price_asc" | "price_desc"
  page?: number
}

export interface ResourceEnvelope<T> {
  data: T
}

``


## features\products\utils.ts

``ts
import type { Category } from "@/features/categories/types"
import type { StockStatus } from "./types"

export interface CategoryOption {
  id: number
  name: string
  depth: number
}

function flatten(categories: Category[], depth: number): CategoryOption[] {
  return categories.flatMap((category) => [
    { id: category.id, name: category.name, depth },
    ...flatten(category.children ?? [], depth + 1),
  ])
}

/** لیست مسطح دسته‌بندی‌ها برای Select انتخاب دسته‌ی محصول. */
export function buildCategoryOptions(categories: Category[]): CategoryOption[] {
  return flatten(categories, 0)
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value)
}

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  in_stock: "موجود",
  out_of_stock: "ناموجود",
  preorder: "پیش‌سفارش",
}

export const STOCK_STATUS_BADGE_VARIANT: Record<StockStatus, "success" | "danger" | "warning"> = {
  in_stock: "success",
  out_of_stock: "danger",
  preorder: "warning",
}
``
