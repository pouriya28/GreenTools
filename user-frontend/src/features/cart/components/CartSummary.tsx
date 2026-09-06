// src/features/cart/components/CartSummary.tsx
import { useNavigate } from "react-router-dom"
import { ClipboardList } from "lucide-react"
import type { Cart } from "../types/Cart"
import { formatToman } from "../utils/formatToman"

interface CartSummaryProps {
  cart: Cart
}

export function CartSummary({ cart }: CartSummaryProps) {
  const navigate = useNavigate()
  const canCheckout = cart.items.length > 0

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-bg-2 p-5">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-primary" />
        <h2 className="font-bold text-text">خلاصه سفارش</h2>
      </div>

      <dl className="flex flex-col gap-2.5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-text-secondary">تعداد اقلام</dt>
          <dd className="text-text">{cart.items_count.toLocaleString("fa-IR")}</dd>
        </div>

        <div className="my-1 h-px bg-border" />

        <div className="flex items-center justify-between text-base">
          <dt className="font-bold text-text">جمع کل</dt>
          <dd className="font-bold text-primary">{formatToman(cart.subtotal)}</dd>
        </div>
      </dl>

      <button
        type="button"
        disabled={!canCheckout}
        onClick={() => navigate("/checkout")}
        className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ثبت و ادامه سفارش
      </button>
    </div>
  )
}