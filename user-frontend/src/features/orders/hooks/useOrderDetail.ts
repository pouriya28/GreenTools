// src/features/orders/hooks/useOrderDetail.ts
import { useQuery } from "@tanstack/react-query"
import { fetchOrderDetail } from "../api/ordersApi"

export function useOrderDetail(orderId: string | undefined) {
	return useQuery({
		queryKey: ["orders", "detail", orderId],
		queryFn: () => fetchOrderDetail(orderId as string),
		enabled: Boolean(orderId),
	})
}