// src/features/wishlist/api/wishlistApi.ts
import { api } from "@/lib/axios"
import type { Product } from "@/features/products/components/ProductCard/ProductTypes"

// اگه بعداً فایل مشترک ApiEnvelope رو پیدا کردی/ساختی، این تایپ محلی رو حذف کن
// و همون تایپ مشترک رو import کن — فقط برای هماهنگی، شکلش را از پاسخ واقعی
// بک‌اند (ApiResponse::success) گرفتم: { success, data, message, code, meta }.
type ApiEnvelope<T> = {
	success: boolean
	data: T
	message?: string | null
	code?: string | null
	meta?: Record<string, unknown>
}

type PaginatedResponse<T> = {
	data: T[]
	meta: { current_page: number; last_page: number; total: number }
}

export async function fetchWishlistProducts(page = 1): Promise<PaginatedResponse<Product>> {
	const { data: envelope } = await api.get<ApiEnvelope<PaginatedResponse<Product>>>("/v1/wishlist", {
		params: { page },
	})
	if (!envelope.success) throw envelope
	return envelope.data
}

export async function fetchWishlistProductIds(): Promise<number[]> {
	const { data: envelope } = await api.get<ApiEnvelope<{ product_ids: number[] }>>("/v1/wishlist/product-ids")
	if (!envelope.success) throw envelope
	return envelope.data.product_ids
}

export async function addToWishlist(productId: number): Promise<void> {
	const { data: envelope } = await api.post<ApiEnvelope<null>>("/v1/wishlist", { product_id: productId })
	if (!envelope.success) throw envelope
}

export async function removeFromWishlist(productId: number): Promise<void> {
	const { data: envelope } = await api.delete<ApiEnvelope<null>>(`/v1/wishlist/${productId}`)
	if (!envelope.success) throw envelope
}