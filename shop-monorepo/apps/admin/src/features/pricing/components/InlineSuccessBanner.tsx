import { forwardRef } from "react"
import type { ComponentPropsWithoutRef } from "react"
import { Input } from "@/components/ui/input"

type NumericInputProps = ComponentPropsWithoutRef<typeof Input>

// Input عددی مشترک: جلوی تقییر ناخواسته‌ی مقدار با اسکرول ماوس روی فیلد
// فوکوس‌شده رو می‌گیره (یک رفتار پیش‌فرض مرورگرهای مبتنی بر Chromium که خطای انسانی
// رایجی برای فیلدهای قیمت/نرخ محسوب می‌شه) — یک‌بار پیاده‌سازی شده و همه‌جا
// (اصلاح قیمت پیشنهادی، ثبت نرخ ارز) استفاده می‌شه.
export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(function NumericInput(
  { onWheel, ...props },
  ref,
) {
  return (
    <Input
      ref={ref}
      type="number"
      inputMode="decimal"
      onWheel={(e) => {
        e.currentTarget.blur()
        onWheel?.(e)
      }}
      {...props}
    />
  )
})
