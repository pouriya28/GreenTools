import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/shared/components/date-picker/DatePicker"
import { ORDER_STATUS_LABELS } from "../types/Order"
import type { OrderListFilters, OrderStatus } from "../types/Order"

interface OrderFiltersProps {
    filters: OrderListFilters
    onChange: (next: Partial<OrderListFilters>) => void
}

const SEARCH_DEBOUNCE_MS = 400

export function OrderFilters({ filters, onChange }: OrderFiltersProps) {
    const [searchInput, setSearchInput] = useState(filters.search ?? "")

    // Fix 1: always hold the latest onChange without adding it to debounce deps
    const onChangeRef = useRef(onChange)
    useEffect(() => { onChangeRef.current = onChange })

    // Fix 2: only sync externally when input is not focused (reset case only)
    const inputRef = useRef<HTMLInputElement>(null)
    useEffect(() => {
        if (document.activeElement !== inputRef.current) {
            setSearchInput(filters.search ?? "")
        }
    }, [filters.search])

    useEffect(() => {
        const trimmed = searchInput.trim()
        const current = filters.search ?? ""

        if (trimmed === current) return

        const timeoutId = window.setTimeout(() => {
            onChangeRef.current({ search: trimmed || undefined })
        }, SEARCH_DEBOUNCE_MS)

        return () => window.clearTimeout(timeoutId)
    }, [searchInput, filters.search])

    // Fix 3: date range guard helpers
    function handleDateFromChange(value: string | null) {
        const next: Partial<OrderListFilters> = { date_from: value ?? undefined }
        if (value && filters.date_to && value > filters.date_to) {
            next.date_to = undefined
        }
        onChange(next)
    }

    function handleDateToChange(value: string | null) {
        const next: Partial<OrderListFilters> = { date_to: value ?? undefined }
        if (value && filters.date_from && value < filters.date_from) {
            next.date_from = undefined
        }
        onChange(next)
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            <Input
                ref={inputRef}
                placeholder="جستجو بر اساس نام یا شماره تماس خریدار..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                maxLength={100}
                className="max-w-xs"
            />
            <Select
                value={filters.status ?? "all"}
                onValueChange={(value) =>
                    onChange({ status: value === "all" ? undefined : (value as OrderStatus) })
                }
            >
                <SelectTrigger className="w-48">
                    <SelectValue placeholder="همه وضعیت‌ها" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                    {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                            {label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="w-40">
                <DatePicker
                    value={filters.date_from ?? null}
                    onChange={handleDateFromChange}
                    placeholder="از تاریخ"
                />
            </div>
            <div className="w-40">
                <DatePicker
                    value={filters.date_to ?? null}
                    onChange={handleDateToChange}
                    placeholder="تا تاریخ"
                />
            </div>
        </div>
    )
}