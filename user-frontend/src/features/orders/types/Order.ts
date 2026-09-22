// src/features/orders/types/Order.ts
export type OrderListItem = {
	id: string
	status: string
	total_amount: number
	items_count: number
	created_at: string
	customer_name: string | null
	customer_phone: string | null
}

export type OrderItem = {
	id: number
	product_id: number | null
	product_name: string
	sku: string
	unit_price: number
	quantity: number
	subtotal: number
}

export type OrderAddress = {
	recipient_name: string
	recipient_phone: string
	province_name: string
	city_name: string
	district: string | null
	postal_code: string
	address_line: string
	plaque: string | null
	unit: string | null
	latitude: number | null
	longitude: number | null
}

export type OrderShipment = {
	status: string
	tracking_code: string | null
	shipped_at: string | null
	delivered_at: string | null
}

export type OrderDetail = {
	id: string
	status: string
	total_amount: number
	shipping_cost: number
	shipping_method_name: string | null
	created_at: string
	items: OrderItem[]
	payment_status: string | null
	address: OrderAddress | null
	shipment: OrderShipment | null
}