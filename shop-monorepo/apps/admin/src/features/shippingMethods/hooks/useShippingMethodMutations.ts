import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createShippingMethod, deleteShippingMethod, updateShippingMethod } from "../api/shippingMethodsApi"
import type { ShippingMethodFormValues } from "../types/ShippingMethod"

export function useShippingMethodMutations() {
	const queryClient = useQueryClient()
	const invalidate = () => queryClient.invalidateQueries({ queryKey: ["shipping-methods"] })

	const create = useMutation({
		mutationFn: (values: ShippingMethodFormValues) => createShippingMethod(values),
		onSuccess: invalidate,
	})

	const update = useMutation({
		mutationFn: ({ id, values }: { id: number; values: Partial<ShippingMethodFormValues> }) =>
			updateShippingMethod(id, values),
		onSuccess: invalidate,
	})

	const remove = useMutation({
		mutationFn: (id: number) => deleteShippingMethod(id),
		onSuccess: invalidate,
	})

	return { create, update, remove }
}