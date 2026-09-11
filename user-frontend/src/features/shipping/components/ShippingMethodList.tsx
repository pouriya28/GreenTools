import type { ShippingMethod } from "../types/Shipping"
import { useShippingMethods } from "../hooks/useShippingMethods"
import { useShippingQuotes } from "../hooks/useShippingQuotes"
import { ShippingMethodCard } from "./ShippingMethodCard"

type ShippingMethodListProps = {
    selectedMethodId: number | null
    onSelect: (method: ShippingMethod) => void
}

export function ShippingMethodList({ selectedMethodId, onSelect }: ShippingMethodListProps) {
    const { data: methods, isLoading, isError } = useShippingMethods()
    const methodIds = methods?.map((m) => m.id) ?? []
    const { quotesById } = useShippingQuotes(methodIds)

    if (isLoading) {
        return <p className="text-sm text-text-secondary">در حال بارگذاری روش‌های ارسال…</p>
    }
    if (isError || !methods) {
        return <p className="text-sm text-red-500">دریافت روش‌های ارسال با خطا مواجه شد.</p>
    }
    if (methods.length === 0) {
        return <p className="text-sm text-text-secondary">در حال حاضر روش ارسالی موجود نیست.</p>
    }

    return (
        <div className="flex flex-col gap-3">
            {methods.map((method) => {
                const quoteState = quotesById[method.id]
                return (
                    <ShippingMethodCard
                        key={method.id}
                        method={method}
                        quote={quoteState?.data}
                        quoteLoading={quoteState?.isLoading ?? false}
                        quoteError={quoteState?.isError ?? false}
                        selected={method.id === selectedMethodId}
                        onSelect={onSelect}
                    />
                )
            })}
        </div>
    )
}