// src/features/cart/hooks/useAddCartItem.ts
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { addCartItem } from "../api/cartApi"
import { cartQueryKeys } from "../utils/cartQueryKeys"
import { notificationService } from "@/shared/notification/notification.service"
import { ApiError } from "@/shared/error/ApiError"

export function useAddCartItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addCartItem,
    onSuccess: (data) => {
      queryClient.setQueryData(cartQueryKeys.all, data)
      notificationService.push({ tone: "success", message: "به سبد خرید اضافه شد." })
    },
    onError: (error) => {
      // فقط ۴۲۲ رو خودمون نشون می‌دیم؛ سایر خطاها (۵۰۰/۴۰۳/شبکه) از قبل
      // توسط interceptor سراسری axios به‌صورت خودکار toast می‌شن.
      if (error instanceof ApiError && error.status === 422) {
        notificationService.push({ tone: "warning", message: error.message })
      }
    },
  })
}