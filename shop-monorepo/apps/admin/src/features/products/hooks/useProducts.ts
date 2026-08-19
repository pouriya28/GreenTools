import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { fetchProducts } from "../api/productsApi"
import type { ProductFilters } from "../types"

export function productsQueryKey(filters: ProductFilters) {
  return ["products", filters] as const
}

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: productsQueryKey(filters),
    queryFn: () => fetchProducts(filters),
    // صفحه‌ی قبلی رو حین رفتن به صفحه‌ی بعد نگه می‌داره تا لیست چشمک نزنه
    placeholderData: keepPreviousData,
  })
}