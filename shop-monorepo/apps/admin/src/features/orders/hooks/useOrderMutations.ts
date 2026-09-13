import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateOrderStatus } from "../api/ordersApi"
import type { OrderStatus } from "../types/Order"

export function useOrderMutations() {
	const queryClient = useQueryClient()

	const updateStatus = useMutation({
		mutationFn: ({ id, status }: { id: number; status: OrderStatus }) => updateOrderStatus(id, status),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["orders"] })
			queryClient.invalidateQueries({ queryKey: ["orders", variables.id] })
		},
	})

	return { updateStatus }
}