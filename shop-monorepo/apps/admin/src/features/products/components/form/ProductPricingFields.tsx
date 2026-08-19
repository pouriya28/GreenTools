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
