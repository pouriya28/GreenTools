// src/features/products/types/ProductDetail.ts
import type { ProductCategory, ProductImage, StockStatus } from "../components/ProductCard/ProductTypes";

export type DiscountType = "percent" | "fixed" | null;

export interface ProductVideo {
  id: number;
  source_type: "upload" | "youtube" | "aparat" | "external";
  url: string;
  external_id: string | null;
  thumbnail_url: string | null;
  title: string | null;
  sort_order: number;
}

export type PurchaseRequirement =
  | "standard"
  | "technical_consultation"
  | "professional_installation"
  | "restricted";
// Matches app/Http/Resources/ProductResource.php (public single-product endpoint)
export interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  sku: string;
  short_description: string | null;
  description: string | null; // HTML tags already stripped by backend
  price: number; // toman
  final_price: number;
  discount_percentage: number | null;
  has_active_discount: boolean;
  discount_type: DiscountType;
  discount_value: number | null;
  discount_ends_at: string | null;
  stock_quantity: number;
  stock_status: StockStatus;
  weight_grams: number | null;
  is_active: boolean;
  is_featured: boolean;
  views_count: number;
  purchases_count: number;
  likes_count: number;
  category: ProductCategory;
  images: ProductImage[];
  videos: ProductVideo[];
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  purchase_requirement: PurchaseRequirement;
  purchase_requirement_label: string;
  technical_notice: string | null;
  installation_notice: string | null;
  compatibility_notice: string | null;
  support_contact_enabled: boolean;
  purchase_confirmation_required: boolean;
}
