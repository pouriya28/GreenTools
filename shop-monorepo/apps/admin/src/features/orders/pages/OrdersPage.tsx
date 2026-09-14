import { useState } from "react"
import { AlertTriangle, Loader2, Printer } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useOrders } from "../hooks/useOrders"
import { OrderTable } from "../components/OrderTable"
import { OrderFilters } from "../components/OrderFilters"
import { OrderDetailDialog } from "../components/OrderDetailDialog"
import type { OrderListFilters, OrderListItem } from "../types/Order"

const DEFAULT_FILTERS: OrderListFilters = { page: 1 }

export default function OrdersPage() {
    const navigate = useNavigate()
    const [filters, setFilters] = useState<OrderListFilters>(DEFAULT_FILTERS)
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
    const { data, isLoading, isError, refetch, isFetching } = useOrders(filters)

    function handleFiltersChange(next: Partial<OrderListFilters>) {
        setFilters((prev) => ({ ...prev, ...next, page: 1 }))
    }

    function handlePageChange(page: number) {
        setFilters((prev) => ({ ...prev, page }))
    }

    return (
        <div className="flex flex-col gap-6" dir="rtl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-text-1">سفارش‌ها</h1>
                    <p className="text-sm text-text-2">
                        {data ? `${data.meta.total} سفارش` : "مدیریت و پیگیری سفارش‌های مشتریان"}
                    </p>
                </div>
                <Button type="button" variant="outline" onClick={() => navigate("/orders/print-labels")}>
                    <Printer className="h-4 w-4" />
                    چاپ لیبل
                </Button>
            </div>

            <OrderFilters filters={filters} onChange={handleFiltersChange} />

            {isLoading && (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-border py-16 text-text-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    در حال بارگذاری سفارش‌ها...
                </div>
            )}

            {isError && (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 py-12 text-danger">
                    <AlertTriangle className="h-6 w-6" />
                    <p className="text-sm">دریافت سفارش‌ها با خطا مواجه شد.</p>
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                        {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
                        تلاش دوباره
                    </Button>
                </div>
            )}

            {!isLoading && !isError && (
                <>
                    <OrderTable orders={data?.data ?? []} onView={(order: OrderListItem) => setSelectedOrderId(order.id)} />
                    {data && data.meta.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <Button type="button" variant="outline" size="sm" disabled={data.meta.current_page <= 1} onClick={() => handlePageChange(data.meta.current_page - 1)}>
                                قبلی
                            </Button>
                            <span className="text-sm text-text-2">صفحه {data.meta.current_page} از {data.meta.last_page}</span>
                            <Button type="button" variant="outline" size="sm" disabled={data.meta.current_page >= data.meta.last_page} onClick={() => handlePageChange(data.meta.current_page + 1)}>
                                بعدی
                            </Button>
                        </div>
                    )}
                </>
            )}

            <OrderDetailDialog orderId={selectedOrderId} open={selectedOrderId !== null} onOpenChange={(open) => !open && setSelectedOrderId(null)} />
        </div>
    )
}