// src/features/cart/components/CartItemRow.tsx
import { Link } from "react-router-dom"
import { FiTrash2, FiAlertTriangle } from "react-icons/fi";
import type { CartItem } from "../types/Cart"
import { CartQuantityStepper } from "./CartQuantityStepper"
import { formatToman } from "../utils/formatToman"

interface CartItemRowProps {
  item: CartItem
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
  isUpdating?: boolean
  validationMessage?: string | null
}

const PURCHASE_REQUIREMENT_LABELS: Record<CartItem["purchase_requirement"], string> = {
  standard: "",
  technical_consultation: "نیاز به مشاوره فنی",
  professional_installation: "نیاز به نصب تخصصی",
  restricted: "محدودیت خرید",
}

export function CartItemRow({ item, onQuantityChange, onRemove, isUpdating , validationMessage }: CartItemRowProps) {
  // محصول ممکن است بعد از افزودن به سبد حذف/آرشیو شده باشد — این حالت را
  // بی‌صدا کرش نمی‌دهیم، صریح نشان می‌دهیم و فقط اجازه‌ی حذف از سبد می‌دهیم.
  const isProductRemoved = item.product_slug === null
  const requirementLabel = PURCHASE_REQUIREMENT_LABELS[item.purchase_requirement]
  const isQuantityLocked = isUpdating || isProductRemoved || !item.in_stock

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-2 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onRemove}
          disabled={isUpdating}
          className="order-1 flex h-8 w-8 shrink-0 items-center justify-center self-start rounded-md text-danger transition-colors hover:bg-danger/10 disabled:opacity-40 sm:order-none sm:self-center"
          aria-label={`حذف ${item.product_name ?? "این محصول"} از سبد خرید`}
        >
          <FiTrash2 className="h-4 w-4" />
        </button>

        <CartItemThumbnail item={item} isProductRemoved={isProductRemoved} />

        <div className="order-3 flex flex-col items-start text-sm sm:order-none sm:w-32 sm:items-center">
          <span className="text-text-secondary">{formatToman(item.unit_price - item.unit_discount)}</span>
          {item.unit_discount > 0 && (
            <span className="text-xs text-text-3 line-through">{formatToman(item.unit_price)}</span>
          )}
        </div>

        <div className="order-4 sm:order-none">
          <CartQuantityStepper
            value={item.quantity}
            max={Infinity}
            disabled={isQuantityLocked}
            onChange={onQuantityChange}
          />
        </div>

        <div className="order-5 text-sm font-bold text-text sm:order-none sm:w-32 sm:text-center">
          {formatToman(item.line_total)}
        </div>
      </div>

      {(isProductRemoved || !item.in_stock || item.price_changed || requirementLabel || validationMessage) && (
        <div className="flex flex-col gap-1 border-t border-border pt-3">
          {isProductRemoved && (
            <RowNotice tone="danger" text="این محصول دیگر در دسترس نیست. لطفاً از سبد خرید حذفش کنید." />
          )}
          {!isProductRemoved && !item.in_stock && (
            <RowNotice tone="danger" text="موجودی کافی برای این تعداد وجود ندارد؛ لطفاً تعداد را کاهش دهید." />
          )}
          {!isProductRemoved && item.price_changed && (
            <RowNotice tone="warning" text="قیمت این کالا از زمان افزودن به سبد تغییر کرده است." />
          )}
          {!isProductRemoved && requirementLabel && (
            <span className="w-fit rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
              {requirementLabel}
            </span>
          )}
          {validationMessage && (
            <RowNotice tone="danger" text={validationMessage} />
          )}
        </div>
      )}
    </div>
  )
}

function CartItemThumbnail({ item, isProductRemoved }: { item: CartItem; isProductRemoved: boolean }) {
  const content = (
    <div className="order-2 flex flex-1 items-center gap-3 sm:order-none">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-bg-1">
        {item.image_url ? (
          <img src={item.image_url} alt={item.product_name ?? ""} className="h-full w-full object-cover" loading="lazy" />
        ) : null}
      </div>
      <span className="truncate text-sm font-semibold text-text">
        {item.product_name ?? "محصول حذف‌شده"}
      </span>
    </div>
  )

  if (isProductRemoved || !item.product_slug) return content

  return <Link to={`/products/${item.product_slug}`}>{content}</Link>
}

function RowNotice({ tone, text }: { tone: "danger" | "warning"; text: string }) {
  const toneClass = tone === "danger" ? "text-danger" : "text-warning"
  return (
    <p className={`flex items-center gap-1.5 text-xs ${toneClass}`}>
      <FiAlertTriangle className="h-3.5 w-3.5 shrink-0" />
      {text}
    </p>
  )
}