import { api } from "@/lib/axios";
import type { Category } from "../types/Category";

interface ApiEnvelope<T> {
  data: T;
}

// GET /v1/categories — فقط دسته‌های ریشه؛ هرکدام با کل زیردرخت در فیلد children
export async function fetchCategoryTree(signal?: AbortSignal): Promise<Category[]> {
  const { data } = await api.get<ApiEnvelope<Category[]>>("/v1/categories", { signal });
  return data.data;
}

// GET /v1/categories/{slug} — یک دسته به‌همراه کل زیردرخت آن (برای صفحه‌ی اختصاصی دسته، در صورت نیاز آینده)
export async function fetchCategoryBySlug(slug: string, signal?: AbortSignal): Promise<Category> {
  const { data } = await api.get<ApiEnvelope<Category>>(`/v1/categories/${slug}`, { signal });
  return data.data;
}