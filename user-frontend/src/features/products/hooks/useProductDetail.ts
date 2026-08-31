// src/features/products/hooks/useProductDetail.ts
import { useQuery } from "@tanstack/react-query";
import { getProductBySlug } from "../api/productDetailApi";

export function useProductDetail(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug(slug),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}