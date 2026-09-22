import { api } from "@/shared/lib/axios"
import type { ShippingMethod, ShippingMethodFormValues } from "../types/ShippingMethod"

interface ApiEnvelope<T> {
	success: boolean
	data: T
	message?: string | null
}

export async function fetchShippingMethods(): Promise<ShippingMethod[]> {
	const { data } = await api.get<ApiEnvelope<ShippingMethod[]>>("/admin/shipping-methods")
	return data.data
}

export async function createShippingMethod(values: ShippingMethodFormValues): Promise<ShippingMethod> {
	const { data } = await api.post<ApiEnvelope<ShippingMethod>>("/admin/shipping-methods", values)
	return data.data
}

export async function updateShippingMethod(
	id: number,
	values: Partial<ShippingMethodFormValues>
): Promise<ShippingMethod> {
	const { data } = await api.put<ApiEnvelope<ShippingMethod>>(`/admin/shipping-methods/${id}`, values)
	return data.data
}

export async function deleteShippingMethod(id: number): Promise<void> {
	await api.delete(`/admin/shipping-methods/${id}`)
}