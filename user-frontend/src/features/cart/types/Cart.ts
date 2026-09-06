// src/features/cart/types/Cart.ts

/** دقیقاً منطبق با CartResource.php + CartItemResource.php واقعی */

import type { PurchaseRequirement } from "@/features/products/types/ProductDetail"

export interface CartItem {
  id: number
  product_id: number
  /** اگر محصول حذف/آرشیو شده باشد، این‌ها null برمی‌گردند (product?-> در بک‌اند) */
  product_name: string | null
  product_slug: string | null
  image_url: string | null
  quantity: number
  unit_price: number
  unit_discount: number
  /** جمع ردیف — مستقیماً از سرور، بدون هیچ محاسبه‌ی موازی سمت فرانت */
  line_total: number
  purchase_requirement: PurchaseRequirement
  purchase_confirmed: boolean
  /** true یعنی قیمت فعلی محصول با قیمت لحظه‌ی افزودن فرق کرده */
  price_changed: boolean
  /** false یعنی موجودی فعلی کمتر از quantity درخواستی این ردیف است */
  in_stock: boolean
}

export interface Cart {
  id: number
  version: number
  items: CartItem[]
  items_count: number
  subtotal: number
}