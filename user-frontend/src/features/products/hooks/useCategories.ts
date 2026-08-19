import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "../api/categories.api";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => fetchCategories(signal),
    staleTime: 5 * 60_000, // دسته‌بندی‌ها به‌ندرت عوض میشن
  });
}