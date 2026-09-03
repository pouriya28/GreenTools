// src/features/products/components/form/ProductPricingFields.tsx
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
    <div className="flex flex-col gap-5 border-t border-slate-800/80 pt-4">
      {/* قیمت به دلار */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="price_usd" className="text-sm font-medium text-slate-200">
          قیمت (دلار)
        </Label>
        <Input
          id="price_usd"
          type="number"
          min={0.01}
          step={0.01}
          className="h-11 border-slate-700/80 bg-slate-900/90 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
          {...register("price_usd", { valueAsNumber: true })}
        />
        {formState.errors.price_usd && (
          <p className="text-xs font-medium text-rose-400">{formState.errors.price_usd.message}</p>
        )}
        {currentTomanPrice != null && (
          <p className="text-xs text-slate-400 leading-relaxed">
            قیمت فعلی به تومان: <span className="font-semibold text-emerald-400">{formatPrice(currentTomanPrice)}</span> — با نرخ ارز روز و بعد از ذخیره دوباره محاسبه می‌شود.
          </p>
        )}
      </div>

      {/* بخش تنظیمات تخفیف */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="discount_type" className="text-sm font-medium text-slate-200">
            نوع تخفیف
          </Label>
          <Controller
            control={control}
            name="discount_type"
            render={({ field }) => (
              <Select
                value={field.value ?? "none"}
                onValueChange={(value) => field.onChange(value === "none" ? null : value)}
              >
                <SelectTrigger
                  id="discount_type"
                  className="h-11 w-full border-slate-700/80 bg-slate-900/90 text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
                >
                  <SelectValue />
                </SelectTrigger>
                {/* 
                  z-[99999] و پس‌زمینه c2 (تیره شفاف با backdrop-blur) 
                  برای جلوگیری از شفاف شدن و همپوشانی با عناصر پایین صفحه
                */}
                <SelectContent className="z-[99999] border-slate-700 bg-slate-900/98 p-1 text-slate-100 shadow-2xl backdrop-blur-md">
                  <SelectItem value="none" className="cursor-pointer rounded-md text-sm text-slate-200 focus:bg-indigo-600 focus:text-white">
                    بدون تخفیف
                  </SelectItem>
                  <SelectItem value="percent" className="cursor-pointer rounded-md text-sm text-slate-200 focus:bg-indigo-600 focus:text-white">
                    درصدی
                  </SelectItem>
                  <SelectItem value="fixed" className="cursor-pointer rounded-md text-sm text-slate-200 focus:bg-indigo-600 focus:text-white">
                    مبلغ ثابت (تومان)
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {discountType && (
          <div className="flex flex-col gap-2 animate-in fade-in-50 duration-200">
            <Label htmlFor="discount_value" className="text-sm font-medium text-slate-200">
              مقدار تخفیف {discountType === "percent" ? "(%)" : "(تومان)"}
            </Label>
            <Input
              id="discount_value"
              type="number"
              min={0}
              className="h-11 border-slate-700/80 bg-slate-900/90 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
              {...register("discount_value", { valueAsNumber: true })}
            />
            {formState.errors.discount_value && (
              <p className="text-xs font-medium text-rose-400">{formState.errors.discount_value.message}</p>
            )}
          </div>
        )}
      </div>

      {/* زمان‌بندی تخفیف */}
      {discountType && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 animate-in fade-in-50 duration-200">
          <div className="flex flex-col gap-2">
            <Label htmlFor="discount_starts_at" className="text-sm font-medium text-slate-200">
              شروع تخفیف
            </Label>
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="discount_ends_at" className="text-sm font-medium text-slate-200">
              پایان تخفیف
            </Label>
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
              <p className="text-xs font-medium text-rose-400">{formState.errors.discount_ends_at.message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}