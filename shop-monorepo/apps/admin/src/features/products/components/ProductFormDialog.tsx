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
