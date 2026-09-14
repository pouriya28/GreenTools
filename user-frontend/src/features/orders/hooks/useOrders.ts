// src/features/orders/hooks/useOrders.ts
import { useQuery } from "@tanstack/react-query"
import { fetchOrders } from "../api/ordersApi"

export function useOrders(page = 1) {
	return useQuery({ queryKey: ["orders", page], queryFn: () => fetchOrders(page) })
}