// src/features/orders/components/OrderDetailModal.tsx
import { FiX } from "react-icons/fi"
import { useOrderDetail } from "../hooks/useOrderDetail"
import { getOrderStatusColor, getOrderStatusLabel } from "../constants/orderStatus"

type OrderDetailModalProps = { orderId: string; onClose: () => void }

export function OrderDetailModal({ orderId, onClose }: OrderDetailModalProps) {
	const { data: order, isLoading, isError } = useOrderDetail(orderId)

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
			<div
				className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-surface p-6 flex flex-col gap-4"
				onClick={(event) => event.stopPropagation()}
				dir="rtl"
			>
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-bold text-text">جزئیات سفارش</h3>
					<button onClick={onClose} className="text-text-secondary hover:text-text">
						<FiX className="text-xl" />
					</button>
				</div>

				{isLoading && <p className="text-text-secondary">در حال بارگذاری...</p>}
				{isError && <p className="text-error">دریافت جزئیات سفارش با خطا مواجه شد.</p>}

				{order && (
					<>
						<div className="flex items-center justify-between">
							<span className={`text-xs font-semibold px-2 py-1 rounded-full ${getOrderStatusColor(order.status)}`}>
								{getOrderStatusLabel(order.status)}
							</span>
							<span className="text-text-secondary text-xs">
								{new Date(order.created_at).toLocaleDateString("fa-IR")}
							</span>
						</div>

						<div className="flex flex-col gap-2">
							{order.items.map((item) => (
								<div key={item.id} className="flex items-center justify-between text-sm">
									<span className="text-text">
										{item.product_name} × {item.quantity.toLocaleString("fa-IR")}
									</span>
									<span className="text-text-secondary">{item.subtotal.toLocaleString("fa-IR")} تومان</span>
								</div>
							))}
						</div>

						<div className="border-t border-border pt-3 flex flex-col gap-1 text-sm">
							<div className="flex justify-between">
								<span className="text-text-secondary">هزینه‌ی ارسال</span>
								<span className="text-text">{order.shipping_cost.toLocaleString("fa-IR")} تومان</span>
							</div>
							<div className="flex justify-between font-bold">
								<span className="text-text">مبلغ کل</span>
								<span className="text-text">{order.total_amount.toLocaleString("fa-IR")} تومان</span>
							</div>
						</div>

						{order.address && (
							<div className="border-t border-border pt-3 text-sm text-text-secondary">
								<p className="text-text font-semibold mb-1">آدرس ارسال</p>
								<p>
									{order.address.recipient_name} — {order.address.recipient_phone}
								</p>
								<p>
									{order.address.province_name}، {order.address.city_name}، {order.address.address_line}
								</p>
							</div>
						)}

						{order.shipment?.tracking_code && (
							<div className="border-t border-border pt-3 text-sm">
								<p className="text-text-secondary">کد پیگیری مرسوله</p>
								<p className="text-text font-semibold">{order.shipment.tracking_code}</p>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	)
}