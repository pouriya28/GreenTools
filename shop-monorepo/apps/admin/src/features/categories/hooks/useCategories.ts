import { useQuery } from "@tanstack/react-query"
import { fetchCategories } from "../api/categoriesApi"

export const categoriesQueryKey = ["categories"] as const

export function useCategories() {
  return useQuery({
    queryKey: categoriesQueryKey,
    queryFn: fetchCategories,
  })
}