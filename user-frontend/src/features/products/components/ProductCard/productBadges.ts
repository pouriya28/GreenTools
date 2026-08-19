// src/features/products/components/ProductCard/productBadges.ts
import type { Product } from "./ProductTypes";

export type BadgeType = "discount" | "featured" | "outOfStock" | "preorder" | "new" | "bestSeller";

export interface ComputedBadge {
  type: BadgeType;
  label: string;
}

const NEW_PRODUCT_DAYS = 14;        // محصول ایجادشده در ۱۴ روز اخیر = «جدید»
const BEST_SELLER_MIN_PURCHASES = 10; // آستانه‌ی «پرفروش» — بعداً می‌تونی بر اساس دیتای واقعی تنظیمش کنی

function isNewProduct(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false; // دفاعی: تاریخ نامعتبر رو کرش نده
  const diffDays = (Date.now() - created) / (1000 * 60 * 60 * 24);
  return diffDays <= NEW_PRODUCT_DAYS;
}

// امن: فقط عدد/enum/تاریخ استاندارد از بکند مصرف میشه، هیچ رشته‌ی خام رندر نمیشه
export function computeBadges(product: Product): ComputedBadge[] {
  const badges: ComputedBadge[] = [];

  if (product.has_active_discount && product.discount_percentage) {
    badges.push({ type: "discount", label: `${product.discount_percentage}%` });
  }

  if (product.stock_status === "out_of_stock") {
    badges.push({ type: "outOfStock", label: "ناموجود" });
  } else if (product.stock_status === "preorder") {
    badges.push({ type: "preorder", label: "پیش‌فروش" });
  }

  if (product.purchases_count >= BEST_SELLER_MIN_PURCHASES) {
    badges.push({ type: "bestSeller", label: "پرفروش" });
  } else if (isNewProduct(product.created_at)) {
    // "جدید" و "پرفروش" با هم نشون داده نمیشن تا کارت شلوغ نشه؛ پرفروش اولویت داره
    badges.push({ type: "new", label: "جدید" });
  }

  if (product.is_featured) {
    badges.push({ type: "featured", label: "ویژه" });
  }

  return badges.slice(0, 3); // سقف ۳ بج روی هر کارت — بیشتر از این شلوغ و زشت میشه
}