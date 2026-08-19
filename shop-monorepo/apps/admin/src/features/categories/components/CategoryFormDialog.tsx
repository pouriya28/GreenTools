import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { applyValidationErrors, getApiErrorMessage } from "@/shared/lib/apiError"
import { categorySchema, type CategoryFormValues } from "../schema"
import type { Category, CategoryPayload } from "../types"
import { useCreateCategory, useUpdateCategory } from "../hooks/useCategoryMutations"
import { buildParentOptions } from "../utils"

const ROOT_PARENT_VALUE = "none"

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** درخت کامل دسته‌بندی‌ها، فقط برای ساختن گزینه‌های «دسته‌ی والد». */
  categories: Category[]
  /** اگه پر باشه یعنی حالت ویرایش، در غیر این‌صورت حالت ساخت. */
  category?: Category | null
}

function buildDefaultValues(category?: Category | null): CategoryFormValues {
  return {
    parent_id: category?.parent_id ?? null,
    name: category?.name ?? "",
    description: category?.description ?? "",
    icon: category?.icon ?? "",
    is_active: category?.is_active ?? true,
    sort_order: category?.sort_order ?? 0,
    // بک‌اند این دو فیلد رو تو CategoryResource برنمی‌گردونه (فقط قابل نوشتنه،
    // قابل خوندن نیست)، پس تو حالت ویرایش نمی‌تونیم مقدار فعلی‌شون رو نشون بدیم.
    meta_title: "",
    meta_description: "",
  }
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  categories,
  category = null,
}: CategoryFormDialogProps) {
  const isEdit = category !== null
  const [formError, setFormError] = useState<string | null>(null)

  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: buildDefaultValues(category),
  })

  // هر بار دیالوگ باز میشه یا دسته‌ی هدف عوض میشه، فرم رو با مقادیر تازه ریست کن.
  useEffect(() => {
    if (open) {
      setFormError(null)
      form.reset(buildDefaultValues(category))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category])

  const parentOptions = buildParentOptions(categories, category)

  async function onSubmit(values: CategoryFormValues) {
    setFormError(null)

    const payload: CategoryPayload = {
      parent_id: values.parent_id,
      name: values.name.trim(),
      description: values.description?.trim() || null,
      icon: values.icon?.trim() || null,
      is_active: values.is_active,
      sort_order: values.sort_order,
      meta_title: values.meta_title?.trim() || null,
      meta_description: values.meta_description?.trim() || null,
    }

    try {
      if (isEdit && category) {
        await updateMutation.mutateAsync({ id: category.id, payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch (err) {
      // اول تلاش کن خطاهای ولیدیشن (422) رو زیر همون فیلد نشون بدی.
      const handled = applyValidationErrors<CategoryFormValues>(err, form.setError)
      if (!handled) {
        setFormError(
          getApiErrorMessage(
            err,
            isEdit ? "ویرایش دسته‌بندی ناموفق بود." : "ساخت دسته‌بندی ناموفق بود."
          )
        )
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-bg-1" dir="rtl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `در حال ویرایش «${category?.name}»`
              : "اطلاعات دسته‌بندی جدید رو وارد کن."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {formError && (
            <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">نام دسته‌بندی</Label>
            <Input
              id="name"
              maxLength={150}
              autoFocus
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-danger">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="parent_id">دسته‌ی والد</Label>
            <Controller
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <Select
                  value={field.value === null ? ROOT_PARENT_VALUE : String(field.value)}
                  onValueChange={(value) =>
                    field.onChange(value === ROOT_PARENT_VALUE ? null : Number(value))
                  }
                >
                  <SelectTrigger id="parent_id">
                    <SelectValue placeholder="بدون والد (سطح اول)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ROOT_PARENT_VALUE}>بدون والد (سطح اول)</SelectItem>
                    {parentOptions.map((option) => (
                      <SelectItem key={option.id} value={String(option.id)}>
                        {"\u2014 ".repeat(option.depth)}
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.parent_id && (
              <p className="text-xs text-danger">{form.formState.errors.parent_id.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">توضیحات</Label>
            <Textarea id="description" rows={3} maxLength={2000} {...form.register("description")} />
            {form.formState.errors.description && (
              <p className="text-xs text-danger">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="icon">آیکون</Label>
              <Input id="icon" maxLength={100} {...form.register("icon")} />
              {form.formState.errors.icon && (
                <p className="text-xs text-danger">{form.formState.errors.icon.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sort_order">ترتیب نمایش</Label>
              <Input
                id="sort_order"
                type="number"
                min={0}
                max={9999}
                {...form.register("sort_order", { valueAsNumber: true })}
              />
              {form.formState.errors.sort_order && (
                <p className="text-xs text-danger">{form.formState.errors.sort_order.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border bg-bg-2 px-3 py-2.5">
            <div className="flex flex-col">
              <Label htmlFor="is_active">فعال</Label>
              <span className="text-xs text-text-2">دسته‌بندی‌های غیرفعال به مشتری نمایش داده نمی‌شن.</span>
            </div>
            <Controller
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <Switch id="is_active" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <details className="rounded-md border border-border">
            <summary className="cursor-pointer px-3 py-2 text-sm text-text-2">
              تنظیمات سئو (اختیاری)
            </summary>
            <div className="flex flex-col gap-4 border-t border-border p-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="meta_title">عنوان متا</Label>
                <Input id="meta_title" maxLength={180} {...form.register("meta_title")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="meta_description">توضیحات متا</Label>
                <Textarea id="meta_description" rows={2} maxLength={300} {...form.register("meta_description")} />
              </div>
            </div>
          </details>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              انصراف
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "ذخیره‌ی تغییرات" : "ساخت دسته‌بندی"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
