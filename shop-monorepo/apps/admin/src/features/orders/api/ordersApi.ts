import { api } from "@/shared/lib/axios"
import type { ApiEnvelope, PaginatedResponse } from "@/shared/types/apiResponse"
import type { OrderDetail, OrderListFilters, OrderListItem, OrderStatus } from "../types/Order"

export async function fetchOrders(filters: OrderListFilters): Promise<PaginatedResponse<OrderListItem>> {
	const { data: envelope } = await api.get<ApiEnvelope<PaginatedResponse<OrderListItem>>>("/admin/orders", {
		params: filters,
	})
	if (!envelope.success) throw envelope
	return envelope.data
}

export async function fetchOrder(id: number): Promise<OrderDetail> {
	const { data: envelope } = await api.get<ApiEnvelope<OrderDetail>>(`/admin/orders/${id}`)
	if (!envelope.success) throw envelope
	return envelope.data
}

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<OrderDetail> {
	const { data: envelope } = await api.patch<ApiEnvelope<OrderDetail>>(`/admin/orders/${id}/status`, { status })
	if (!envelope.success) throw envelope
	return envelope.data
}