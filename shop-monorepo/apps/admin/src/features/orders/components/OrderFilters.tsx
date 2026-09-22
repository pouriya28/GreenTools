import { useEffect, useState } from "react"
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
    // state داخلی جدا از filters والد: اینطوری هر keystroke فقط همین
    // کامپوننت رو ری‌رندر می‌کنه، نه کل صفحه/کوئری رو.
    const [searchInput, setSearchInput] = useState(filters.search ?? "")

    // اگر فیلتر از بیرون (مثلاً دکمه‌ی "پاک کردن فیلترها") ریست شد، input هم sync بشه.
    useEffect(() => {
        setSearchInput(filters.search ?? "")
    }, [filters.search])

    useEffect(() => {
        const trimmed = searchInput.trim()
        const current = filters.search ?? ""

        // اگر مقدار trim‌شده تغییری نکرده، درخواست اضافه به سرور نزن.
        if (trimmed === current) {
            return
        }

        const timeoutId = window.setTimeout(() => {
            onChange({ search: trimmed || undefined })
        }, SEARCH_DEBOUNCE_MS)

        return () => window.clearTimeout(timeoutId)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput])

    return (
        <div className="flex flex-wrap items-center gap-3">
            <Input
                placeholder="جستجو بر اساس نام یا شماره تماس خریدار..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                maxLength={100}
                className="max-w-xs"
            />
            <Select
                value={filters.status ?? "all"}
                onValueChange={(value) => onChange({ status: value === "all" ? undefined : (value as OrderStatus) })}
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
                    onChange={(value) => onChange({ date_from: value ?? undefined })}
                    placeholder="از تاریخ"
                />
            </div>
            <div className="w-40">
                <DatePicker
                    value={filters.date_to ?? null}
                    onChange={(value) => onChange({ date_to: value ?? undefined })}
                    placeholder="تا تاریخ"
                />
            </div>
        </div>
    )
}