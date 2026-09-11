import { useQuery } from "@tanstack/react-query"
import { fetchShippingMethods } from "../api/shippingApi"
import { shippingQueryKeys } from "../utils/shippingQueryKeys"

export function useShippingMethods() {
	return useQuery({
		queryKey: shippingQueryKeys.list(),
		queryFn: fetchShippingMethods,
		staleTime: 5 * 60 * 1000,
	})
}