import { api } from "@/shared/lib/axios"
import type { ApiEnvelope } from "@/shared/types/apiResponse"
import type {
	CreateSenderAddressPayload,
	GenerateShippingLabelsPayload,
	SenderAddress,
	ShippingLabelSheet,
} from "../types/Label"

export async function fetchSenderAddresses(): Promise<SenderAddress[]> {
	const { data: envelope } = await api.get<ApiEnvelope<SenderAddress[]>>("/admin/sender-addresses")
	if (!envelope.success) throw envelope
	return envelope.data
}

export async function createSenderAddress(payload: CreateSenderAddressPayload): Promise<SenderAddress> {
	const { data: envelope } = await api.post<ApiEnvelope<SenderAddress>>("/admin/sender-addresses", payload)
	if (!envelope.success) throw envelope
	return envelope.data
}

// Returns plain order/sender/layout data now — the browser renders and prints
// the label sheet itself, no PDF binary involved anymore.
export async function generateShippingLabels(
	payload: GenerateShippingLabelsPayload,
): Promise<ShippingLabelSheet> {
	const { data: envelope } = await api.post<ApiEnvelope<ShippingLabelSheet>>("/admin/shipping-labels", payload)
	if (!envelope.success) throw envelope
	return envelope.data
}