import { api } from "@/shared/lib/axios"
import type { PaginatedResponse } from "@/shared/types/pagination.types"
import type {
  Product,
  ProductFilters,
  ProductImage,
  ProductListItem,
  ProductPayload,
  ProductVideo,
  ResourceEnvelope,
} from "../types"

const BASE = "/products/admin"

function toQueryParams(filters: ProductFilters) {
  return {
    search: filters.search || undefined,
    category_id: filters.category_id || undefined,
    is_active: filters.is_active,
    stock_status: filters.stock_status || undefined,
    sort: filters.sort || undefined,
    page: filters.page || 1,
  }
}

export async function fetchProducts(filters: ProductFilters) {
  const { data } = await api.get<PaginatedResponse<ProductListItem>>(BASE, {
    params: toQueryParams(filters),
  })
  return data
}

export async function fetchProduct(id: number) {
  const { data } = await api.get<ResourceEnvelope<Product>>(`${BASE}/${id}`)
  return data.data
}

export async function createProduct(payload: ProductPayload) {
  const { data } = await api.post<ResourceEnvelope<Product>>(BASE, payload)
  return data.data
}

export async function updateProduct(id: number, payload: Partial<ProductPayload>) {
  const { data } = await api.patch<ResourceEnvelope<Product>>(`${BASE}/${id}`, payload)
  return data.data
}

export async function deleteProduct(id: number) {
  await api.delete(`${BASE}/${id}`)
}

export async function toggleFeaturedProduct(id: number) {
  const { data } = await api.patch<ResourceEnvelope<Product>>(`${BASE}/${id}/toggle-featured`)
  return data.data
}

export async function fetchTrashedProducts(page = 1) {
  const { data } = await api.get<PaginatedResponse<ProductListItem>>(`${BASE}/trash`, {
    params: { page },
  })
  return data
}

export async function restoreProduct(id: number) {
  const { data } = await api.post<ResourceEnvelope<Product>>(`${BASE}/${id}/restore`)
  return data.data
}

export async function forceDeleteProduct(id: number) {
  await api.delete(`${BASE}/${id}/force`)
}

// -----------------------------------------------------------------------
// مدیریت عکس/ویدیوی محصول (ProductMediaController)
// نکته: مسیرها و رفتار سرور از routes/api/v1/products.php و
// ProductMediaService.php تأیید شده. محدودیت‌های زیر برای فقط برای پیام
// خطای زودهنگام سمت کلاینت‌ان؛ اعتبارسنجی واقعی و امن سمت سرور انجام می‌شه.
// -----------------------------------------------------------------------

export const MAX_IMAGES_PER_UPLOAD = 10
export const MAX_IMAGE_SIZE_BYTES = 5120 * 1024
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

export const MAX_VIDEOS_PER_PRODUCT = 5
export const MAX_VIDEO_SIZE_BYTES = 51200 * 1024
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"]

export type VideoSourceType = "upload" | "youtube" | "aparat" | "external"

export interface StoreProductVideoPayload {
  source_type: VideoSourceType
  title?: string | null
  external_url?: string | null
  video?: File | null
}

export async function storeProductImages(productId: number, files: File[], altTexts: string[] = []) {
  const formData = new FormData()
  files.forEach((file) => formData.append("images[]", file))
  files.forEach((_file, index) => formData.append("alt_texts[]", altTexts[index] ?? ""))

  const { data } = await api.post<ResourceEnvelope<ProductImage[]>>(`${BASE}/${productId}/images`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data.data
}

export async function setPrimaryProductImage(productId: number, imageId: number) {
  await api.patch(`${BASE}/${productId}/images/${imageId}/primary`)
}

export async function deleteProductImage(productId: number, imageId: number) {
  await api.delete(`${BASE}/${productId}/images/${imageId}`)
}

export async function storeProductVideo(productId: number, payload: StoreProductVideoPayload) {
  if (payload.source_type === "upload") {
    const formData = new FormData()
    formData.append("source_type", payload.source_type)
    if (payload.title) formData.append("title", payload.title)
    if (payload.video) formData.append("video", payload.video)

    const { data } = await api.post<ResourceEnvelope<ProductVideo>>(`${BASE}/${productId}/videos`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return data.data
  }

  const { data } = await api.post<ResourceEnvelope<ProductVideo>>(`${BASE}/${productId}/videos`, {
    source_type: payload.source_type,
    title: payload.title || null,
    external_url: payload.external_url || null,
  })
  return data.data
}

export async function deleteProductVideo(productId: number, videoId: number) {
  await api.delete(`${BASE}/${productId}/videos/${videoId}`)
}
