// src/features/products/api/productDetailApi.ts
import { api } from "@/lib/axios";
import type { ProductDetail } from "../types/ProductDetail";

interface ApiEnvelope<T> {
  data: T;
}

// GET /v1/products/{slug} — public, read-only, active() scope only, increments views_count
export async function getProductBySlug(slug: string): Promise<ProductDetail> {
  const { data } = await api.get<ApiEnvelope<ProductDetail>>(`/v1/products/${slug}`);
  return data.data;
}