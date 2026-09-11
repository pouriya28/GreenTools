export const shippingQueryKeys = {
	all: ["shipping"] as const,
	list: () => [...shippingQueryKeys.all, "list"] as const,
}
