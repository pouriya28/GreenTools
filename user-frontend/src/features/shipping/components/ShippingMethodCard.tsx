import type { ShippingMethod, ShippingQuote } from "../types/Shipping"

interface ShippingMethodCardProps {
    method: ShippingMethod
    quote?: ShippingQuote
    quoteLoading: boolean
    quoteError: boolean
    selected: boolean
    onSelect: (method: ShippingMethod) => void
}

function formatEstimatedDays(min: number | null, max: number | null): string | null {
    if (min === null && max === null) return null
    if (min !== null && max !== null && min !== max) {
        return `تحویل تقریبی: ${min} تا ${max} روز کاری`
    }
    const days = min ?? max
    return `تحویل تقریبی: ${days} روز کاری`
}

/** کارت انتخاب روش ارسال — استایل هماهنگ با AddressCard. قیمت همیشه از quote واقعی سرور می‌آید. */
export function ShippingMethodCard({ method, quote, quoteLoading, quoteError, selected, onSelect }: ShippingMethodCardProps) {
    const estimatedDaysLabel = formatEstimatedDays(method.estimated_days_min, method.estimated_days_max)

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onSelect(method)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onSelect(method)
                }
            }}
            className={`relative flex cursor-pointer items-center justify-between gap-3 rounded-2xl border bg-surface p-4 transition ${
                selected ? "border-primary shadow-[0_0_20px_var(--primary-glow)]" : "border-border hover:border-primary/50"
            }`}
        >
            <div className="flex flex-col gap-1">
                <span className="font-bold text-text">{method.name}</span>
                {estimatedDaysLabel && (
                    <span className="text-xs text-text-secondary">{estimatedDaysLabel}</span>
                )}
            </div>

            <span className="text-sm font-bold text-primary">
                {quoteLoading && <span className="text-text-secondary">در حال محاسبه…</span>}
                {!quoteLoading && quoteError && <span className="text-error">خطا در محاسبه قیمت</span>}
                {!quoteLoading && !quoteError && quote && (
                    quote.is_free_shipping
                        ? "رایگان"
                        : `${quote.calculation_type !== "fixed" ? "از " : ""}${quote.cost.toLocaleString("fa-IR")} تومان`
                )}
            </span>
        </div>
    )
}