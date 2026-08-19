import { api } from "@/lib/axios";

export interface CategoryNode {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
}

export async function fetchCategories(signal?: AbortSignal): Promise<CategoryNode[]> {
  const { data } = await api.get<{ data: CategoryNode[] }>("/v1/categories", { signal });
  // بکند فعلاً هم ریشه‌ها هم زیردسته‌ها رو flat برمی‌گردونه (با with('children') نستد هم شدن)
  // اینجا فقط دسته‌های ریشه رو نگه می‌داریم تا در فیلتر تکراری نمایش داده نشن
  return data.data.filter((c) => c.parent_id === null);
}