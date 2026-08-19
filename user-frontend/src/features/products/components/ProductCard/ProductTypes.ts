// src/features/products/components/ProductCard/ProductTypes.ts

export type StockStatus = "in_stock" | "out_of_stock" | "preorder";

export interface ProductImage {
  id: number;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
}

// دقیقاً منطبق با app/Http/Resources/ProductListResource.php
export interface Product {
  id: number;
  name: string;
  slug: string;
  short_description: string | null;
  price: number;
  final_price: number;
  discount_percentage: number | null;
  has_active_discount: boolean;
  stock_status: StockStatus;
  is_featured: boolean;
  purchases_count: number;
  created_at: string; // ISO 8601
  category: ProductCategory;
  primary_image: ProductImage | null;
}

export interface ProductCardProps {
  product: Product;
}