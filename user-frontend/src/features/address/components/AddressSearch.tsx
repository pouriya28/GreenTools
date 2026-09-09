import { useState } from "react"
import { useAddressSearch } from "../hooks/useAddressSearch"
import type { PlaceSearchResult } from "../api/mapApi"

interface AddressSearchProps {
    center: { lat: number; lng: number } | null
    onSelect: (result: PlaceSearchResult) => void
}

function IconSearchGlyph({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
    )
}

/**
 * باکس جستجوی آدرس بالای نقشه. نتایج بر اساس مرکز فعلی نقشه (center) مرتب
 * می‌شوند — همان نقطهٔ مرجعی که Neshan Search API به‌عنوان ورودی اجباری لازم دارد.
 * انتخاب کاربر فقط به onSelect گزارش می‌شود؛ جابجایی نقشه/مارکر و Reverse
 * Geocode بعدی، مسئولیت MapPickerModal است.
 */
export function AddressSearch({ center, onSelect }: AddressSearchProps) {
    const [term, setTerm] = useState("")
    const { results, isLoading } = useAddressSearch({ term, center })

    function handleSelect(result: PlaceSearchResult) {
        setTerm("")
        onSelect(result)
    }

    return (
        <div className="pointer-events-auto relative w-full">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2.5 shadow">
                <IconSearchGlyph className="h-4 w-4 shrink-0 text-text-secondary" />
                <input
                    type="text"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="جستجوی آدرس، خیابان، مکان…"
                    className="w-full bg-transparent text-sm text-text placeholder:text-muted focus:outline-none"
                />
            </div>
            {term.trim().length >= 2 && (
                <div className="absolute inset-x-0 top-full z-10 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-border bg-surface shadow-lg">
                    {isLoading && <div className="px-3 py-2.5 text-xs text-muted">در حال جستجو…</div>}
                    {!isLoading && results.length === 0 && (
                        <div className="px-3 py-2.5 text-xs text-muted">نتیجه‌ای یافت نشد</div>
                    )}
                    {!isLoading &&
                        results.map((result, index) => (
                            <button
                                key={`${result.title}-${index}`}
                                type="button"
                                onClick={() => handleSelect(result)}
                                className="flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2.5 text-right last:border-b-0 hover:bg-primary/10"
                            >
                                <span className="text-sm font-medium text-text">{result.title}</span>
                                <span className="text-xs text-text-secondary">{result.address}</span>
                            </button>
                        ))}
                </div>
            )}
        </div>
    )
}
