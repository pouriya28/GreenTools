import { api } from "@/lib/axios"
import type { CheckoutResult } from "../types/Checkout"

// همان الگوی ApiEnvelope محلی مطابق بقیهٔ فایل‌های api فراند (cartApi.ts, addressApi.ts).
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

/**
 * سبد فعلی کاربر را با آدرسی که انتخاب کرده نهایی می‌کند و سفارش می‌سازد.
 * مالکیت ادرس (که متعلق به کاربر لاگین‌شده باشد) روی بک‌اند چک می‌شود (IDOR guard)؛
 * اگر متعلق نباشد پاسخ 404 می‌دهد که به‌صورت خطای عمومی (نه 422) توسط axios interceptor toast می‌شود.
 */
export async function submitCheckout(addressId: number,shippingMethodId: number): Promise<CheckoutResult> {
	const response = await api.post<ApiEnvelope<CheckoutResult>>("/v1/checkout", {
		address_id: addressId,
		shipping_method_id: shippingMethodId,
	})
	return response.data.data
}
