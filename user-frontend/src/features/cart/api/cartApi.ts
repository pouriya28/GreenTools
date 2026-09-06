// src/features/cart/api/cartApi.ts
import { api } from "@/lib/axios"
import type { Cart } from "../types/Cart"

interface ApiEnvelope<T> {
  success: boolean
  data: T
  message: string | null
  code: string | null
  meta: { request_id: string | null; timestamp: string }
}

export async function fetchCart(): Promise<Cart> {
  const { data } = await api.get<ApiEnvelope<Cart>>("/v1/cart")
  return data.data
}

export interface AddCartItemInput {
  product_id: number
  quantity: number
  purchase_confirmed?: boolean
}

export async function addCartItem(input: AddCartItemInput): Promise<Cart> {
  const { data } = await api.post<ApiEnvelope<Cart>>("/v1/cart/items", input)
  return data.data
}

/** version = آخرین نسخه‌ای که همین کلاینت از سبد دیده — برای تشخیص تداخل همزمان لازم است */
export async function updateCartItemQuantity(itemId: number, quantity: number, version: number): Promise<Cart> {
  const { data } = await api.patch<ApiEnvelope<Cart>>(`/v1/cart/items/${itemId}`, { quantity, version })
  return data.data
}

export async function removeCartItem(itemId: number, version: number): Promise<Cart> {
  const { data } = await api.delete<ApiEnvelope<Cart>>(`/v1/cart/items/${itemId}`, { params: { version } })
  return data.data
}