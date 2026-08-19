import type { Category } from "@/features/categories/types"

export type DiscountType = "percent" | "fixed"
export type StockStatus = "in_stock" | "out_of_stock" | "preorder"

export interface ProductImage {
  id: number
  url: string
  alt_text: string | null
  is_primary: boolean
  sort_order: number
}

export interface ProductVideo {
  id: number
  source_type: "upload" | "youtube" | "aparat" | "external"
  url: string
  external_id: string | null
  thumbnail_url: string | null
  title: string | null
  sort_order: number
}

export interface ProductCategorySummary {
  id: number
  name: string
  slug: string
}

// شکل کامل، خروجی ProductResource — برای دیالوگ ویرایش
export interface Product {
  id: number
  name: string
  slug: string
  sku: string
  short_description: string | null
  description: string | null

  // قیمت نهایی به تومان (ستون price_toman در بک‌اند) — همون چیزی که همه‌جای
  // سایت به کاربر نهایی نمایش داده می‌شه.
  price: number
  // قیمت مرجع به دلار؛ ادمین این فیلد رو مستقیم ویرایش می‌کنه و بک‌اند بر
  // اساس نرخ ارز روز، price (تومان) رو از روی این محاسبه می‌کنه.
  // نکته: قبلاً ProductResource این فیلد رو برنمی‌گردوند (باگ) — در همین
  // بازبینی اصلاح شد.
  price_usd: number
  final_price: number
  discount_percentage: number | null
  has_active_discount: boolean
  discount_type: DiscountType | null
  discount_value: number | null
  // نکته: قبلاً ProductResource فقط discount_ends_at رو برمی‌گردوند و
  // discount_starts_at همیشه گم می‌شد (باعث می‌شد هر ویرایش، تاریخ شروع
  // تخفیف رو خالی کنه). در همین بازبینی به ProductResource اضافه شد.
  discount_starts_at: string | null
  discount_ends_at: string | null

  stock_quantity: number
  stock_status: StockStatus
  weight_grams: number | null

  is_active: boolean
  is_featured: boolean
  views_count: number
  purchases_count: number
  likes_count: number

  category: Category
  images: ProductImage[]
  videos: ProductVideo[]

  meta_title: string | null
  meta_description: string | null
  created_at: string | null
  updated_at: string | null
}

// شکل خلاصه، خروجی ProductListResource — برای جدول/کارت لیست
export interface ProductListItem {
  id: number
  name: string
  slug: string
  // قبلاً در ProductListResource برنمی‌گشت (باگ) — در همین بازبینی اضافه شد.
  sku: string
  short_description: string | null
  price: number
  final_price: number
  discount_percentage: number | null
  has_active_discount: boolean
  stock_status: StockStatus
  is_featured: boolean
  purchases_count: number
  created_at: string | null
  deleted_at?: string | null
  category: ProductCategorySummary
  primary_image: ProductImage | null
}

// دقیقاً منطبق با StoreProductRequest/UpdateProductRequest
export interface ProductPayload {
  category_id: number
  name: string
  sku: string
  short_description?: string | null
  description?: string | null

  // قبلاً price (تومان) مستقیم ارسال می‌شد؛ الان بک‌اند price_usd می‌گیره
  // و خودش تومان رو بر اساس نرخ روز حساب می‌کنه.
  price_usd: number
  discount_type?: DiscountType | null
  discount_value?: number | null
  discount_starts_at?: string | null
  discount_ends_at?: string | null

  stock_quantity: number
  stock_status: StockStatus
  weight_grams?: number | null

  is_active?: boolean
  meta_title?: string | null
  meta_description?: string | null
}

export interface ProductFilters {
  search?: string
  category_id?: number
  is_active?: boolean
  stock_status?: StockStatus
  sort?: "newest" | "oldest" | "price_asc" | "price_desc"
  page?: number
}

export interface ResourceEnvelope<T> {
  data: T
}
