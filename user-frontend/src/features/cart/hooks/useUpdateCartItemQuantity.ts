// src/features/cart/hooks/useUpdateCartItemQuantity.ts
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateCartItemQuantity } from "../api/cartApi"
import { cartQueryKeys } from "../utils/cartQueryKeys"
import type { Cart } from "../types/Cart"

interface Variables {
  itemId: number
  quantity: number
}

export function useUpdateCartItemQuantity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, quantity }: Variables) => {
      const cart = queryClient.getQueryData<Cart>(cartQueryKeys.all)
      if (!cart) throw new Error("سبد خرید هنوز بارگذاری نشده است.")
      // همیشه آخرین version دیده‌شده توسط همین کلاینت ارسال می‌شود؛ اگر جای
      // دیگری (تب دیگر یا انقضای رزرو) سبد عوض شده باشد، سرور خطای تداخل
      // نسخه برمی‌گرداند و onSettled کل سبد را دوباره از سرور همگام می‌کند.
      return updateCartItemQuantity(itemId, quantity, cart.version)
    },

    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: cartQueryKeys.all })
      const previousCart = queryClient.getQueryData<Cart>(cartQueryKeys.all)

      if (previousCart) {
        queryClient.setQueryData<Cart>(cartQueryKeys.all, {
          ...previousCart,
          items: previousCart.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item,
          ),
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