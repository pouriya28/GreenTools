import { api } from "@/lib/axios"
import type { ShippingMethod, ShippingQuote } from "../types/Shipping"

type ApiEnvelope<T> = {
	success: boolean
	data: T
	message?: string
	code?: string
	meta?: {
		request_id?: string
		timestamp?: string
	}
}

/** فهرست روش‌های ارسال فعال (عمومی، بدون نیاز به لاگین). */
export async function fetchShippingMethods(): Promise<ShippingMethod[]> {
	const response = await api.get<ApiEnvelope<ShippingMethod[]>>("/v1/shipping-methods")
	return response.data.data
}

/**
 * استعلام هزینه‌ی دقیق ارسال (وزن‌محور) برای سبد فعلی کاربر.
 * سبد از روی ResolveCart (کوکی مهمان/کاربر لاگین‌شده) شناسایی می‌شود، نیازی به ارسال cart_id نیست.
 */
export async function fetchShippingQuote(shippingMethodId: number): Promise<ShippingQuote> {
	const response = await api.post<ApiEnvelope<ShippingQuote>>("/v1/shipping-quote", {
		shipping_method_id: shippingMethodId,
	})
	return response.data.data
}