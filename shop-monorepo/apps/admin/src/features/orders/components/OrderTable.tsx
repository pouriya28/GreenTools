import { Package } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { OrderStatusBadge } from "./OrderStatusBadge"
import type { OrderListItem } from "../types/Order"

interface OrderTableProps {
    orders: OrderListItem[]
    onView: (order: OrderListItem) => void
}

function formatToman(amount: number): string {
    return `${amount.toLocaleString("fa-IR")} تومان`
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    })
}

export function OrderTable({ orders, onView }: OrderTableProps) {
    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-text-2">
                <Package className="h-8 w-8 opacity-50" />
                <p className="text-sm">
                    سفارشی با این فیلترها پیدا نشد.
                </p>
            </div>
        )
    }

    return (
        <div className="w-full overflow-x-auto rounded-xl border border-border">
            <Table className="w-full min-w-[900px] table-fixed">
                <colgroup>
                    {/* شماره سفارش */}
                    <col className="w-[10%]" />

                    {/* خریدار */}
                    <col className="w-[20%]" />

                    {/* وضعیت */}
                    <col className="w-[14%]" />

                    {/* تعداد اقلام */}
                    <col className="w-[12%]" />

                    {/* مبلغ کل */}
                    <col className="w-[16%]" />

                    {/* تاریخ ثبت */}
                    <col className="w-[16%]" />

                    {/* عملیات */}
                    <col className="w-[12%]" />
                </colgroup>

                <TableHeader>
                    <TableRow>
                        <TableHead className="whitespace-nowrap text-right">
                            شماره سفارش
                        </TableHead>

                        <TableHead className="text-right">
                            خریدار
                        </TableHead>

                        <TableHead className="whitespace-nowrap text-right">
                            وضعیت
                        </TableHead>

                        <TableHead className="whitespace-nowrap text-right">
                            تعداد اقلام
                        </TableHead>

                        <TableHead className="whitespace-nowrap text-right">
                            مبلغ کل
                        </TableHead>

                        <TableHead className="whitespace-nowrap text-right">
                            تاریخ ثبت
                        </TableHead>

                        <TableHead className="whitespace-nowrap text-left">
                            عملیات
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {orders.map((order) => (
                        <TableRow
                            key={order.id}
                            className="transition-colors hover:bg-white/[0.03]"
                        >
                            {/* Order ID */}
                            <TableCell
                                className="overflow-hidden text-right font-medium text-text-1"
                                dir="ltr"
                            >
                                <span className="block truncate">
                                    #{order.id}
                                </span>
                            </TableCell>

                            {/* Customer */}
                            <TableCell className="overflow-hidden text-right">
                                <div className="min-w-0">
                                    <span className="block truncate text-text-1">
                                        {order.customer_name ?? "—"}
                                    </span>

                                    {order.customer_phone && (
                                        <span
                                            className="mt-0.5 block truncate text-xs text-text-3"
                                            dir="ltr"
                                        >
                                            {order.customer_phone}
                                        </span>
                                    )}
                                </div>
                            </TableCell>

                            {/* Status */}
                            <TableCell className="overflow-hidden text-right">
                                <div className="flex min-w-0 items-center">
                                    <OrderStatusBadge status={order.status} />
                                </div>
                            </TableCell>

                            {/* Items count */}
                            <TableCell className="whitespace-nowrap text-right text-text-2">
                                {order.items_count.toLocaleString("fa-IR")}
                            </TableCell>

                            {/* Total */}
                            <TableCell
                                className="overflow-hidden text-right text-text-2"
                                dir="ltr"
                            >
                                <span className="block truncate whitespace-nowrap">
                                    {formatToman(order.total_amount)}
                                </span>
                            </TableCell>

                            {/* Date */}
                            <TableCell className="overflow-hidden text-right text-text-2">
                                <span className="block truncate whitespace-nowrap">
                                    {formatDate(order.created_at)}
                                </span>
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="text-left">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="whitespace-nowrap"
                                    onClick={() => onView(order)}
                                >
                                    جزئیات
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}