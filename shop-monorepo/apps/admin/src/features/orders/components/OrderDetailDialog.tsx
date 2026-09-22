import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useOrder } from "../hooks/useOrder"
import { OrderStatusBadge } from "./OrderStatusBadge"
import { UpdateOrderStatusDialog } from "./UpdateOrderStatusDialog"

interface OrderDetailDialogProps {
	orderId: number | null
	open: boolean
	onOpenChange: (open: boolean) => void
}

function formatToman(amount: number): string {
	return `${amount.toLocaleString("fa-IR")} تومان`
}

export function OrderDetailDialog({ orderId, open, onOpenChange }: OrderDetailDialogProps) {
	const { data: order, isLoading } = useOrder(orderId ?? 0)
	const [statusDialogOpen, setStatusDialogOpen] = useState(false)

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent dir="rtl" className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>جزئیات سفارش {order ? `#${order.id}` : ""}</DialogTitle>
					</DialogHeader>

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
								<Button type="button" size="sm" onClick={() => setStatusDialogOpen(true)}>تغییر وضعیت</Button>
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
											<th className="p-2 text-right">قیمت واحد</th>
											<th className="p-2 text-right">جمع</th>
										</tr>
									</thead>
									<tbody>
										{order.items.map((item) => (
											<tr key={item.id} className="border-b border-border last:border-0">
												<td className="p-2 text-text-1">{item.product_name}</td>
												<td className="p-2 text-text-2">{item.quantity}</td>
												<td className="p-2 text-text-2">{formatToman(item.unit_price)}</td>
												<td className="p-2 text-text-2">{formatToman(item.subtotal)}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							<div className="flex items-center justify-between text-sm">
								<span className="text-text-2">هزینه ارسال ({order.shipping_method_name ?? "—"})</span>
								<span className="text-text-1">{formatToman(order.shipping_cost)}</span>
							</div>
							<div className="flex items-center justify-between text-base font-semibold">
								<span>مبلغ کل</span>
								<span>{formatToman(order.total_amount)}</span>
							</div>

							{order.shipment && (
								<div className="rounded-lg border border-border p-3 text-sm text-text-2">
									<p>وضعیت مرسوله: {order.shipment.status}</p>
									{order.shipment.tracking_code && <p dir="ltr">کد رهگیری: {order.shipment.tracking_code}</p>}
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>

			<UpdateOrderStatusDialog order={order ?? null} open={statusDialogOpen} onOpenChange={setStatusDialogOpen} />
		</>
	)
}