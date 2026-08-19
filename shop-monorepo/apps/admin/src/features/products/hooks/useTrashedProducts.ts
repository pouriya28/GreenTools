import { useQuery } from "@tanstack/react-query"
import { fetchTrashedProducts } from "../api/productsApi"

export function trashedProductsQueryKey(page: number) {
  return ["products", "trash", page] as const
}

export function useTrashedProducts(page: number) {
  return useQuery({
    queryKey: trashedProductsQueryKey(page),
    queryFn: () => fetchTrashedProducts(page),
  })
}