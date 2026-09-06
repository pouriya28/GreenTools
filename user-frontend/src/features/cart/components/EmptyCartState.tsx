// src/features/cart/components/EmptyCartState.tsx
import { Link } from "react-router-dom"
import { FiShoppingCart } from "react-icons/fi"

export function EmptyCartState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-bg-2 px-6 py-16 text-center">
      <FiShoppingCart className="h-12 w-12 text-text-3" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-text">سبد خرید شما خالی است</p>
        <p className="text-sm text-text-secondary">هنوز محصولی به سبد خرید اضافه نکرده‌اید.</p>
      </div>
      <Link
        to="/products"
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
      >
        مشاهده‌ی محصولات
      </Link>
    </div>
  )
}