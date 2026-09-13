import { useQuery } from "@tanstack/react-query"
import { fetchOrder } from "../api/ordersApi"

export function useOrder(id: number) {
	return useQuery({
		queryKey: ["orders", id],
		queryFn: () => fetchOrder(id),
		enabled: Number.isFinite(id) && id > 0,
	})
}