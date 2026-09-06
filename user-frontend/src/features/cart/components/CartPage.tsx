// src/features/cart/components/CartPage.tsx
import { Link } from "react-router-dom"
import { FiArrowRight } from "react-icons/fi"
import { ApiError } from "@/shared/error/ApiError"
import { useCart } from "../hooks/useCart"
import { useUpdateCartItemQuantity } from "../hooks/useUpdateCartItemQuantity"
import { useRemoveCartItem } from "../hooks/useRemoveCartItem"
import { CartItemsList } from "./CartItemsList"
import { CartSummary } from "./CartSummary"
import { CartTrustBadges } from "./CartTrustBadges"

export function CartPage() {
  const { data: cart, isLoading, isError } = useCart()
  const updateQuantity = useUpdateCartItemQuantity()
  const removeItem = useRemoveCartItem()

  if (isLoading) return <CartPageSkeleton />

  if (isError || !cart) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-text-secondary" dir="rtl">
        در دریافت سبد خرید مشکلی پیش آمد. لطفاً صفحه را رفرش کنید.
      </div>
    )
  }

  // فقط خطای ۴۲۲ را خودمان inline نشان می‌دهیم؛ بقیه‌ی کدهای خطا از قبل توسط
  // interceptor سراسری axios به‌صورت toast نمایش داده شده‌اند (رفتار تکراری نمی‌سازیم).
  const pendingMutation = updateQuantity.isPending ? updateQuantity : removeItem.isPending ? removeItem : null
  const pendingItemId = updateQuantity.isPending
    ? (updateQuantity.variables?.itemId ?? null)
    : removeItem.isPending
      ? (removeItem.variables ?? null)
      : null

  const validationError =
    updateQuantity.isError &&
    updateQuantity.error instanceof ApiError &&
    updateQuantity.error.status === 422 &&
    updateQuantity.variables
      ? { itemId: updateQuantity.variables.itemId, message: updateQuantity.error.message }
      : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-8" dir="rtl">
      <div className="mb-8 flex flex-col gap-1.5">
        <h1 className="text-xl font-bold text-text sm:text-2xl">سبد خرید شما</h1>
        <p className="text-sm text-text-secondary">محصولات انتخاب‌شده برای سفارش در سبد خرید شما قرار دارند.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="flex flex-col gap-4">
          <CartItemsList
            cart={cart}
            pendingItemId={pendingItemId}
            validationError={validationError}
            onQuantityChange={(itemId, quantity) => updateQuantity.mutate({ itemId, quantity })}
            onRemove={(itemId) => removeItem.mutate(itemId)}
          />

          {cart.items.length > 0 && (
            <div className="flex justify-end">
              <Link
                to="/products"
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
              >
                ادامه خرید
                <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        <CartSummary cart={cart} />
      </div>

      <div className="mt-10">
        <CartTrustBadges />
      </div>
    </div>
  )
}

function CartPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8" dir="rtl">
      <div className="mb-8 h-8 w-48 rounded bg-bg-2" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-3">
          <div className="h-24 rounded-xl bg-bg-2" />
          <div className="h-24 rounded-xl bg-bg-2" />
          <div className="h-24 rounded-xl bg-bg-2" />
        </div>
        <div className="h-64 rounded-xl bg-bg-2" />
      </div>
    </div>
  )
}