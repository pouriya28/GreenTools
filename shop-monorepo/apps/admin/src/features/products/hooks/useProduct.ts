import { useQuery } from "@tanstack/react-query"
import { fetchProduct } from "../api/productsApi"

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: ["products", "detail", id],
    queryFn: () => fetchProduct(id as string),
    enabled: id !== null,
  })
}