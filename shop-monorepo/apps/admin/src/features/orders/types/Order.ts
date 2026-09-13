export type OrderStatus =
	| "pending_payment"
	| "paid"
	| "processing"
	| "packed"
	| "shipped"
	| "delivered"
	| "cancelled"

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
	pending_payment: "در انتظار پرداخت",
	paid: "پرداخت‌شده",
	processing: "در حال پردازش",
	packed: "بسته‌بندی‌شده",
	shipped: "ارسال‌شده",
	delivered: "تحویل‌شده",
	cancelled: "لغوشده",
}

// بر اساس allowedNextStates() که قبلاً در OrderStatus enum تأیید شد.
// اگر منطق enum از اون موقع تغییر کرده، این جدول رو هم آپدیت کن.
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
	pending_payment: ["paid", "cancelled"],
	paid: ["processing", "cancelled"],
	processing: ["packed", "cancelled"],
	packed: ["shipped", "cancelled"],
	shipped: ["delivered"],
	delivered: [],
	cancelled: [],
}

export interface OrderListItem {
	id: number
	status: OrderStatus
	total_amount: number
	items_count: number
	created_at: string
	customer_name?: string | null
	customer_phone?: string | null
}

export interface OrderItem {
	id: number
	product_id: number | null
	product_name: string
	sku: string | null
	unit_price: number
	quantity: number
	subtotal: number
}

export interface OrderAddressSnapshot {
	recipient_name: string
	recipient_phone: string
	province_name: string
	city_name: string
	district: string | null
	postal_code: string | null
	address_line: string
	plaque: string | null
	unit: string | null
	latitude: number | null
	longitude: number | null
}

export interface OrderShipment {
	status: string
	tracking_code: string | null
	shipped_at: string | null
	delivered_at: string | null
}

export interface OrderDetail {
	id: number
	status: OrderStatus
	total_amount: number
	shipping_cost: number
	shipping_method_name: string | null
	created_at: string
	items: OrderItem[]
	payment_status: string | null
	address: OrderAddressSnapshot | null
	shipment: OrderShipment | null
}

// این فیلترها فعلاً روی فرض «بک‌اند بعداً پیاده می‌کنیم» تایپ شدن.
export interface OrderListFilters {
	status?: OrderStatus
	date_from?: string
	date_to?: string
	search?: string
	per_page?: number
	page?: number
}