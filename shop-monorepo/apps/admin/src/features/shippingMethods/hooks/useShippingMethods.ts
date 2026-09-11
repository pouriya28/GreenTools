import { useQuery } from "@tanstack/react-query"
import { fetchShippingMethods } from "../api/shippingMethodsApi"

export function useShippingMethods() {
	return useQuery({
		queryKey: ["shipping-methods"],
		queryFn: fetchShippingMethods,
	})
}