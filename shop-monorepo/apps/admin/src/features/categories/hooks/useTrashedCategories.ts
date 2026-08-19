import { useQuery } from "@tanstack/react-query"
import { fetchTrashedCategories } from "../api/categoriesApi"

export const trashedCategoriesQueryKey = ["categories", "trash"] as const

export function useTrashedCategories() {
  return useQuery({
    queryKey: trashedCategoriesQueryKey,
    queryFn: fetchTrashedCategories,
  })
}