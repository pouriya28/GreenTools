// src/features/cart/hooks/useCart.ts
import { useQuery } from "@tanstack/react-query"
import { fetchCart } from "../api/cartApi"
import { cartQueryKeys } from "../utils/cartQueryKeys"

export function useCart() {
  return useQuery({
    queryKey: cartQueryKeys.all,
    queryFn: fetchCart,
    // سبد خرید داده‌ی حساس/تغییرپذیر است؛ کش قدیمی نمایش نده مگر لحظه‌ی لود اول
    staleTime: 0,
  })
}