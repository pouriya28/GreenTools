import { useQuery } from "@tanstack/react-query"
import { fetchOrder } from "../api/ordersApi"

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => fetchOrder(id),
    enabled: id.length > 0,
  })
}