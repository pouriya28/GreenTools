import { useQuery } from "@tanstack/react-query"
import { fetchProduct } from "../api/productsApi"

export function useProduct(id: number | null) {
  return useQuery({
    queryKey: ["products", "detail", id],
    queryFn: () => fetchProduct(id as number),
    enabled: id !== null,
  })
}