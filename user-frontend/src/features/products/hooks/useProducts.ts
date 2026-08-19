import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchProducts } from "../api/products.api";
import type { ProductFiltersState } from "../types/filters.types";

export function useProducts(filters: ProductFiltersState) {
  return useInfiniteQuery({
    queryKey: ["products", filters],
    queryFn: ({ pageParam, signal }) => fetchProducts(filters, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.current_page < lastPage.meta.last_page ? lastPage.meta.current_page + 1 : undefined,
    staleTime: 30_000,
    retry: 1,
  });
}