// src/features/cart/components/CartMenu.tsx
import { useRef, useState } from "react"
import { Link } from "react-router-dom"
import { FiShoppingCart } from "react-icons/fi"
import { useCart } from "../hooks/useCart"
import { formatToman } from "../utils/formatToman"

const CLOSE_DELAY_MS = 150

/**
 * آیکون سبد خرید هدر + پیش‌نمایش hover-only (فقط دسکتاپ).
 * از همون کش react-query که بج تعداد رو هم پر می‌کنه استفاده می‌کنه —
 * درخواست شبکه‌ی اضافه‌ای برای این پیش‌نمایش زده نمی‌شه.
 */
export function CartMenu() {
  const { data: cart } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const itemCount = cart?.items_count ?? 0
  const previewItems = cart?.items.slice(0, 4) ?? []
  const remainingCount = Math.max(0, (cart?.items.length ?? 0) - previewItems.length)

  function open() {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    setIsOpen(true)
  }

  function scheduleClose() {
    closeTimeoutRef.current = setTimeout(() => setIsOpen(false), CLOSE_DELAY_MS)
  }

  return (
    <div className="relative hidden sm:block" onMouseEnter={open} onMouseLeave={scheduleClose}>
      <CartIconLink itemCount={itemCount} />

      {isOpen && cart && (
        <div
          className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-white/10 bg-surface/95 p-3 shadow-2xl backdrop-blur-xl"
          dir="rtl"
        >
          {cart.items.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-secondary">سبد خرید شما خالی است.</p>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {previewItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-bg-1">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.product_name ?? ""}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-text">
                        {item.product_name ?? "محصول حذف‌شده"}
                      </p>
                      <p className="text-[11px] text-text-secondary">
                        {item.quantity.toLocaleString("fa-IR")} × {formatToman(item.unit_price - item.unit_discount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {remainingCount > 0 && (
                <p className="mt-2 text-center text-[11px] text-text-secondary">
                  و {remainingCount.toLocaleString("fa-IR")} کالای دیگر
                </p>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-sm">
                <span className="text-text-secondary">جمع کل</span>
                <span className="font-bold text-primary">{formatToman(cart.subtotal)}</span>
              </div>
            </>
          )}

          <Link
            to="/cart"
            className="mt-3 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-primary/90"
          >
            مشاهده سبد خرید
          </Link>
        </div>
      )}
    </div>
  )
}

function CartIconLink({ itemCount }: { itemCount: number }) {
  return (
    <Link
      to="/cart"
      aria-label={itemCount > 0 ? `سبد خرید (${itemCount} کالا)` : "سبد خرید"}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-surface/60 text-text transition-all hover:border-primary/40 hover:text-primary"
    >
      <FiShoppingCart className="text-lg" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black shadow-sm">
          {itemCount > 99 ? "99+" : itemCount.toLocaleString("fa-IR")}
        </span>
      )}
    </Link>
  )
}