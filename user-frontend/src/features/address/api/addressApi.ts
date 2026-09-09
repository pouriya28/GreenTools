import { api } from "@/lib/axios"
import type { Address, AddressInput, UpdateAddressInput } from "../types/Address"

interface ApiEnvelope<T> {
	success: boolean
	data: T
	message: string | null
	code: string | null
	meta: { request_id: string | null; timestamp: string }
}

export async function fetchAddresses(): Promise<Address[]> {
	const { data } = await api.get<ApiEnvelope<Address[]>>("/v1/addresses")
	return data.data
}

export async function fetchAddress(id: number): Promise<Address> {
	const { data } = await api.get<ApiEnvelope<Address>>(`/v1/addresses/${id}`)
	return data.data
}

export async function createAddress(input: AddressInput): Promise<Address> {
	const { data } = await api.post<ApiEnvelope<Address>>("/v1/addresses", input)
	return data.data
}

// Backend route is `PUT /addresses/{address}`, not PATCH — keep verbs in sync
// with routes/api/v1/addresses.php.
export async function updateAddress(id: number, input: UpdateAddressInput): Promise<Address> {
	const { data } = await api.put<ApiEnvelope<Address>>(`/v1/addresses/${id}`, input)
	return data.data
}

export async function deleteAddress(id: number): Promise<void> {
	await api.delete<ApiEnvelope<null>>(`/v1/addresses/${id}`)
}

export async function setDefaultAddress(id: number): Promise<Address> {
	const { data } = await api.post<ApiEnvelope<Address>>(`/v1/addresses/${id}/default`, {})
	return data.data
}
