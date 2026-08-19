import { useQuery } from "@tanstack/react-query";
import { fetchFeaturedProducts } from "../api/products.api";

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ["featured-products"],
    queryFn: ({ signal }) => fetchFeaturedProducts(signal),
  });
}