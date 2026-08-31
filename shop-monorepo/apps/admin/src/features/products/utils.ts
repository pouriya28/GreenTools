import type { Category } from "@/features/categories/types"
import type { PurchaseRequirement, StockStatus } from "./types"

export interface CategoryOption {
  id: number
  name: string
  depth: number
}

function flatten(categories: Category[], depth: number): CategoryOption[] {
  return categories.flatMap((category) => [
    { id: category.id, name: category.name, depth },
    ...flatten(category.children ?? [], depth + 1),
  ])
}

/** لیست مسطح دسته‌بندی‌ها برای Select انتخاب دسته‌ی محصول. */
export function buildCategoryOptions(categories: Category[]): CategoryOption[] {
  return flatten(categories, 0)
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value)
}

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  in_stock: "موجود",
  out_of_stock: "ناموجود",
  preorder: "پیش‌سفارش",
}

export const STOCK_STATUS_BADGE_VARIANT: Record<StockStatus, "success" | "danger" | "warning"> = {
  in_stock: "success",
  out_of_stock: "danger",
  preorder: "warning",
}

export const PURCHASE_REQUIREMENT_LABELS: Record<PurchaseRequirement, string> = {
  standard: "خرید عادی",
  technical_consultation: "نیاز به مشاوره فنی",
  professional_installation: "نیاز به نصب تخصصی",
  restricted: "محدود - نیاز به تماس با پشتیبانی",
}

export const PURCHASE_REQUIREMENT_BADGE_VARIANT: Record<PurchaseRequirement, "success" | "warning" | "danger"> = {
  standard: "success",
  technical_consultation: "warning",
  professional_installation: "warning",
  restricted: "danger",
}