import { useEffect, useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useOrder } from "../hooks/useOrder"
import { OrderStatusBadge } from "./OrderStatusBadge"
import { UpdateOrderStatusDialog } from "./UpdateOrderStatusDialog"

interface OrderDetailDialogProps {
    orderId: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

function formatToman(amount: number): string {
    return `${amount.toLocaleString("fa-IR")} تومان`
}

export function OrderDetailDialog({ orderId, open, onOpenChange }: OrderDetailDialogProps) {
    const { data: order, isLoading, isError, refetch } = useOrder(orderId ?? "")
    const [statusDialogOpen, setStatusDialogOpen] = useState(false)

    // Fix 2: reset status dialog when order changes
    useEffect(() => {
        setStatusDialogOpen(false)
    }, [orderId])

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent dir="rtl" className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>جزئیات سفارش {order ? `#${order.id}` : ""}</DialogTitle>
                    </DialogHeader>

                    {/* Fix 1: handle isError */}
                    {isError && (
                        <div className="flex flex-col items-center gap-3 py-10 text-danger">
                            <AlertTriangle className="h-5 w-5" />
                            <p className="text-sm">خطا در بارگذاری اطلاعات سفارش.</p>
                            <Button variant="outline" size="sm" onClick={() => refetch()}>
                                تلاش دوباره
                            </Button>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex items-center justify-center gap-2 py-10 text-text-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            در حال بارگذاری...
                        </div>
                    )}

                    {order && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <OrderStatusBadge status={order.status} />
                                <Button type="button" size="sm" onClick={() => setStatusDialogOpen(true)}>
                                    تغییر وضعیت
                                </Button>
                            </div>

                            {order.address && (
                                <div className="rounded-lg border border-border p-3 text-sm text-text-2">
                                    <p className="font-medium text-text-1">{order.address.recipient_name}</p>
                                    <p dir="ltr" className="text-left">{order.address.recipient_phone}</p>
                                    <p>
                                        {order.address.province_name}، {order.address.city_name}
                                        {order.address.district ? `، ${order.address.district}` : ""}
                                    </p>
                                    <p>{order.address.address_line}</p>
                                </div>
                            )}

                            <div className="overflow-x-auto rounded-lg border border-border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border text-text-2">
                                            <th className="p-2 text-right">کالا</th>
                                            <th className="p-2 text-right">تعداد</th>
                                            {/* Fix 3: numeric columns explicit dir */}
                                            <th className="p-2 text-right">قیمت واحد</th>
                                            <th className="p-2 text-right">جمع</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.items.map((item) => (
                                            <tr key={item.id} className="border-b border-border last:border-0">
                                                <td className="p-2 text-text-1">{item.product_name}</td>
                                                <td className="p-2 text-text-2">{item.quantity}</td>
                                                <td className="p-2 text-right text-text-2" dir="ltr">
                                                    {formatToman(item.unit_price)}
                                                </td>
                                                <td className="p-2 text-right text-text-2" dir="ltr">
                                                    {formatToman(item.subtotal)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-text-2">هزینه ارسال ({order.shipping_method_name ?? "—"})</span>
                                <span className="text-text-1" dir="ltr">{formatToman(order.shipping_cost)}</span>
                            </div>
                            <div className="flex items-center justify-between text-base font-semibold">
                                <span>مبلغ کل</span>
                                <span dir="ltr">{formatToman(order.total_amount)}</span>
                            </div>

                            {order.shipment && (
                                <div className="rounded-lg border border-border p-3 text-sm text-text-2">
                                    <p>وضعیت مرسوله: {order.shipment.status}</p>
                                    {order.shipment.tracking_code && (
                                        <p dir="ltr" className="text-left">کد رهگیری: {order.shipment.tracking_code}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <UpdateOrderStatusDialog
                order={order ?? null}
                open={statusDialogOpen}
                onOpenChange={setStatusDialogOpen}
            />
        </>
    )
}