import { useMutation, useQueryClient } from "@tanstack/react-query"
import { submitCheckout } from "../api/checkoutApi"
import { cartQueryKeys } from "@/features/cart/utils/cartQueryKeys"

/**
 * بعد از موفقیت، کارت اینوالید می‌شود (سفارش ساخته شد و سبد خالی است)، پس واکش cart را invalidate
 * می‌کنیم تا همه‌جا (بدگه سبد توی هدر/CartPage) فوراً خالی نمایش داده شود.
 */
export function useCheckout() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ addressId, shippingMethodId }: { addressId: number; shippingMethodId: number }) =>
			 submitCheckout(addressId, shippingMethodId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: cartQueryKeys.all })
		},
	})
}
