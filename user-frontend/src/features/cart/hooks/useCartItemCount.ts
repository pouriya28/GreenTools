// src/features/cart/hooks/useCartItemCount.ts
import { useCart } from "./useCart"

/** فقط عدد بج هدر رو از همون کش react-query سبد می‌خونه — درخواست جدا نمی‌زنه */
export function useCartItemCount(): number {
  const { data } = useCart()
  return data?.items_count ?? 0
}