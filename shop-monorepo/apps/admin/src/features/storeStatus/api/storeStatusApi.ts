import { api } from "@/shared/lib/axios"
import type { StoreStatus } from "../types/StoreStatus"

interface ApiEnvelope<T> {
	success: boolean
	data: T
	message?: string | null
}

export async function fetchStoreStatus(): Promise<StoreStatus> {
	const { data } = await api.get<ApiEnvelope<StoreStatus>>("/admin/store-status")
	return data.data
}

export async function closeStore(reason?: string): Promise<StoreStatus> {
	const { data } = await api.post<ApiEnvelope<StoreStatus>>("/admin/store-status/close", { reason })
	return data.data
}

export async function openStore(): Promise<StoreStatus> {
	const { data } = await api.post<ApiEnvelope<StoreStatus>>("/admin/store-status/open", {})
	return data.data
}