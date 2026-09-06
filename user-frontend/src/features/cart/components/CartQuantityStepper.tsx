// src/features/cart/components/CartQuantityStepper.tsx
import { useEffect, useRef, useState } from "react"

interface CartQuantityStepperProps {
  value: number
  /** حداکثر مقدار مجاز طبق موجودی واقعی سرور (نه یک عدد دلخواه فرانت) */
  max: number
  min?: number
  disabled?: boolean
  onChange: (quantity: number) => void
}

/**
 * استپر تعداد، خرد و مستقل از منطق سبد.
 * تغییرات را debounce می‌کند تا هر کلیک پشت‌سرهم یک request جدا نسازد
 * (هم UX بهتر، هم فشار کمتر روی rate limiter بک‌اند cart-write).
 */
export function CartQuantityStepper({ value, max, min = 1, disabled, onChange }: CartQuantityStepperProps) {
  const [localValue, setLocalValue] = useState(value)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  function commit(next: number) {
    const clamped = Math.min(max, Math.max(min, next))
    setLocalValue(clamped)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (clamped !== value) onChange(clamped)
    }, 400)
  }

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-2 px-2 py-1">
      <button
        type="button"
        disabled={disabled || localValue <= min}
        onClick={() => commit(localValue - 1)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-lg text-text-2 transition-colors hover:bg-bg-3 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="کاهش تعداد"
      >
        −
      </button>

      <span className="min-w-6 text-center text-sm font-medium text-text tabular-nums">
        {localValue.toLocaleString("fa-IR")}
      </span>

      <button
        type="button"
        disabled={disabled || localValue >= max}
        onClick={() => commit(localValue + 1)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-lg text-text-2 transition-colors hover:bg-bg-3 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="افزایش تعداد"
      >
        +
      </button>
    </div>
  )
}