import { useQueries } from "@tanstack/react-query"
import { fetchShippingQuote } from "../api/shippingApi"
import type { ShippingQuote } from "../types/Shipping"

type QuoteState = {
    data?: ShippingQuote
    isLoading: boolean
    isError: boolean
}

/**
 * استعلام موازی هزینه‌ی ارسال برای لیستی از روش‌های ارسال.
 * فقط برای کاربر لاگین‌شده معتبر است (endpoint نیاز به auth دارد).
 */
export function useShippingQuotes(methodIds: number[]) {
    const results = useQueries({
        queries: methodIds.map((id) => ({
            queryKey: ["shipping-quote", id],
            queryFn: () => fetchShippingQuote(id),
            staleTime: 5 * 60 * 1000,
        })),
    })

    const quotesById: Record<number, QuoteState> = {}
    methodIds.forEach((id, index) => {
        const result = results[index]
        quotesById[id] = {
            data: result?.data,
            isLoading: result?.isLoading ?? false,
            isError: result?.isError ?? false,
        }
    })

    return { quotesById }
}