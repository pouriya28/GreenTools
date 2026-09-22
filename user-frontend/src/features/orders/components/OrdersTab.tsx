// src/features/orders/components/OrdersTab.tsx
import { useState } from "react"
import { PageLoader } from "@/shared/components/PageLoader"
import { useOrders } from "../hooks/useOrders"
import { getOrderStatusColor, getOrderStatusLabel } from "../constants/orderStatus"
import { OrderDetailModal } from "./OrderDetailModal"

export function OrdersTab() {
	const [page, setPage] = useState(1)
	const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
	const { data, isLoading, isError } = useOrders(page)

	if (isLoading) return <PageLoader />
	if (isError) return <div className="py-16 text-center text-error">دریافت سفارش‌ها با خطا مواجه شد.</div>

	const orders = data?.data ?? []
	const meta = data?.meta

	return (
		<div className="flex flex-col gap-4">
			{orders.length === 0 ? (
				<p className="text-text-secondary">هنوز سفارشی ثبت نکرده‌اید.</p>
			) : (
				<div className="flex flex-col gap-3">
					{orders.map((order) => (
						<button
							key={order.id}
							onClick={() => setSelectedOrderId(order.id)}
							className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border text-right hover:border-primary/40 transition"
						>
							<div className="flex flex-col gap-1">
								<span className="font-bold text-text">سفارش #{order.id.slice(-8)}</span>
								<span className="text-text-secondary text-xs">{order.items_count.toLocaleString("fa-IR")} کالا</span>
							</div>
							<div className="flex flex-col items-end gap-1">
								<span className={`text-xs font-semibold px-2 py-1 rounded-full ${getOrderStatusColor(order.status)}`}>
									{getOrderStatusLabel(order.status)}
								</span>
								<span className="text-text font-bold text-sm">{order.total_amount.toLocaleString("fa-IR")} تومان</span>
							</div>
						</button>
					))}
				</div>
			)}

			{meta && meta.last_page > 1 && (
				<div className="flex justify-center gap-2 mt-2">
					{Array.from({ length: meta.last_page }, (_, i) => i + 1).map((p) => (
						<button
							key={p}
							onClick={() => setPage(p)}
							className={`w-8 h-8 rounded-lg text-sm ${
								p === page ? "bg-primary text-black" : "bg-surface text-text-secondary"
							}`}
						>
							{p.toLocaleString("fa-IR")}
						</button>
					))}
				</div>
			)}

			{selectedOrderId && <OrderDetailModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />}
		</div>
	)
}