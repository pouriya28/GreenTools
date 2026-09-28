import { useQuery } from "@tanstack/react-query"
import { api } from "@/shared/lib/axios";
import type { AttributeOption } from "../types"

export function useAttributeOptions() {
  return useQuery({
    queryKey: ["attributes", "list"],
    queryFn: async () => {
      const { data } = await api.get<{ data: AttributeOption[] }>("/admin/attributes")
      return data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}