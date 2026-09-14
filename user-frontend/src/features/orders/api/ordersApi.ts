// src/features/orders/api/ordersApi.ts
import { api } from "@/lib/axios"
import type { OrderDetail, OrderListItem } from "../types/Order"

type ApiEnvelope<T> = { success: boolean; data: T; message?: string | null }

type PaginatedPayload<T> = {
	data: T[]
	meta: { current_page: number; last_page: number; total: number; per_page: number }
}

export async function fetchOrders(page = 1, perPage = 20): Promise<PaginatedPayload<OrderListItem>> {
	const { data: envelope } = await api.get<ApiEnvelope<PaginatedPayload<OrderListItem>>>("/v1/orders", {
		params: { page, per_page: perPage },
	})
	if (!envelope.success) throw envelope
	return envelope.data
}

// توجه: کنترلر show() پاسخ را به‌صورت { data: new OrderResource(...) } برمی‌گرداند،
// و ApiResponse::success دوباره آن را زیر یک "data" دیگر می‌گذارد — پس اینجا envelope.data.data لازم است.
export async function fetchOrderDetail(orderId: string): Promise<OrderDetail> {
	const { data: envelope } = await api.get<ApiEnvelope<{ data: OrderDetail }>>(`/v1/orders/${orderId}`)
	if (!envelope.success) throw envelope
	return envelope.data.data
}