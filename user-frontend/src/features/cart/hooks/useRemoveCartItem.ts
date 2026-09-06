// src/features/cart/hooks/useRemoveCartItem.ts
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { removeCartItem } from "../api/cartApi"
import { cartQueryKeys } from "../utils/cartQueryKeys"
import type { Cart } from "../types/Cart"

export function useRemoveCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemId: number) => {
      const cart = queryClient.getQueryData<Cart>(cartQueryKeys.all)
      if (!cart) throw new Error("سبد خرید هنوز بارگذاری نشده است.")
      return removeCartItem(itemId, cart.version)
    },

    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: cartQueryKeys.all })
      const previousCart = queryClient.getQueryData<Cart>(cartQueryKeys.all)

      if (previousCart) {
        queryClient.setQueryData<Cart>(cartQueryKeys.all, {
          ...previousCart,
          items: previousCart.items.filter((item) => item.id !== itemId),
        })
      }

      return { previousCart }
    },

    onError: (_err, _vars, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(cartQueryKeys.all, context.previousCart)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartQueryKeys.all })
    },
  })
}