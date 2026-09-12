import { useQuery } from "@tanstack/react-query";
import { fetchCategoryTree } from "../api/categories.api";

export function useCategories() {
  return useQuery({
    queryKey: ["categories", "tree"],
    queryFn: ({ signal }) => fetchCategoryTree(signal),
    staleTime: 5 * 60_000, // دسته‌بندی‌ها به‌ندرت عوض می‌شن
  });
}