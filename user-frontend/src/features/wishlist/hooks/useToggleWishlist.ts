// src/features/wishlist/hooks/useToggleWishlist.ts
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { addToWishlist, removeFromWishlist } from "../api/wishlistApi"
import { notificationService } from "@/shared/notification/notification.service"

type ToggleArgs = { productId: number; isWishlisted: boolean }

export function useToggleWishlist() {
	const queryClient = useQueryClient()
	const queryKey = ["wishlist", "product-ids"]

	return useMutation({
		mutationFn: async ({ productId, isWishlisted }: ToggleArgs) => {
			if (isWishlisted) {
				await removeFromWishlist(productId)
			} else {
				await addToWishlist(productId)
			}
		},
		onMutate: async ({ productId, isWishlisted }: ToggleArgs) => {
			await queryClient.cancelQueries({ queryKey })
			const previous = queryClient.getQueryData<number[]>(queryKey) ?? []
			const next = isWishlisted
				? previous.filter((id) => id !== productId)
				: [...previous, productId]
			queryClient.setQueryData(queryKey, next)
			return { previous }
		},
		onError: (_err, _vars, context) => {
			if (context?.previous) {
				queryClient.setQueryData(queryKey, context.previous)
			}
			notificationService.error("عملیات با خطا مواجه شد.")
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey })
		},
	})
}