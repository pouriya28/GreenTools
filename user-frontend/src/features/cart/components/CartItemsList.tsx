// src/features/cart/components/CartItemsList.tsx
import type { Cart } from "../types/Cart"
import { CartItemRow } from "./CartItemRow"
import { EmptyCartState } from "./EmptyCartState"

interface CartItemsListProps {
  cart: Cart
  onQuantityChange: (itemId: number, quantity: number) => void
  onRemove: (itemId: number) => void
  pendingItemId: number | null
  /** پیام خطای ۴۲۲ (اگر باشد) و شناسه‌ی ردیفی که این خطا مال آن است */
  validationError: { itemId: number; message: string } | null
}

export function CartItemsList({ cart, onQuantityChange, onRemove, pendingItemId, validationError }: CartItemsListProps) {
  if (cart.items.length === 0) return <EmptyCartState />

  return (
    <div className="flex flex-col gap-3">
      {cart.items.map((item) => (
        <CartItemRow
          key={item.id}
          item={item}
          isUpdating={pendingItemId === item.id}
          validationMessage={validationError?.itemId === item.id ? validationError.message : null}
          onQuantityChange={(quantity) => onQuantityChange(item.id, quantity)}
          onRemove={() => onRemove(item.id)}
        />
      ))}
    </div>
  )
}