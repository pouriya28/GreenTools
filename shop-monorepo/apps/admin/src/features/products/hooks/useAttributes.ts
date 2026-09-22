import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/shared/lib/apiClient" // همون کلاینتی که بقیه‌ی api فایل‌ها استفاده می‌کنن؛ اگه اسمش فرق داره بگو تا تطبیق بدم
import type { AttributeOption } from "../types"

export function useAttributeOptions() {
  return useQuery({
    queryKey: ["attributes", "list"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: AttributeOption[] }>("/admin/attributes")
      return data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}