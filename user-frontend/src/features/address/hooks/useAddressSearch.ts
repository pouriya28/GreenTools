import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { searchPlaces, type PlaceSearchResult } from "../api/mapApi"

const MIN_TERM_LENGTH = 2
const DEBOUNCE_MS = 400

interface UseAddressSearchArgs {
    term: string
    center: { lat: number; lng: number } | null
    enabled?: boolean
}

/**
 * جستجوی دیبانس‌شدهٔ آدرس/مکان روی نقشه. عمداً کوئری را فقط وقتی می‌فرستد که
 * حداقل ۲ کاراکتر تایپ شده و مرکز نقشه (نقطهٔ مرجع لازم برای Search API نشان)
 * مشخص باشد؛ این هم UX را بهتر می‌کند و هم فشار روی throttle:search-address
 * بک‌اند را کم می‌کند.
 */
export function useAddressSearch({ term, center, enabled = true }: UseAddressSearchArgs) {
    const [debouncedTerm, setDebouncedTerm] = useState(term)

    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedTerm(term), DEBOUNCE_MS)
        return () => clearTimeout(timeout)
    }, [term])

    const trimmed = debouncedTerm.trim()
    const canSearch = enabled && !!center && trimmed.length >= MIN_TERM_LENGTH

    const query = useQuery<PlaceSearchResult[]>({
        queryKey: ["address-search", trimmed, center?.lat, center?.lng],
        queryFn: () =>
            searchPlaces({
                term: trimmed,
                latitude: center!.lat,
                longitude: center!.lng,
            }),
        enabled: canSearch,
        staleTime: 60_000,
    })

    return useMemo(
        () => ({
            results: canSearch ? query.data ?? [] : [],
            isLoading: canSearch && query.isFetching,
            isError: query.isError,
        }),
        [canSearch, query.data, query.isFetching, query.isError],
    )
}
