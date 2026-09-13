import { useQuery } from "@tanstack/react-query"
import { fetchOrders } from "../api/ordersApi"
import type { OrderListFilters } from "../types/Order"

export function useOrders(filters: OrderListFilters) {
	return useQuery({
		queryKey: ["orders", filters],
		queryFn: () => fetchOrders(filters),
		placeholderData: (previousData) => previousData,
	})
}