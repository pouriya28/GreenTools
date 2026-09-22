// src/features/wishlist/hooks/useWishlistProducts.ts
import { useQuery } from "@tanstack/react-query"
import { fetchWishlistProducts } from "../api/wishlistApi"

export function useWishlistProducts(page = 1) {
	return useQuery({
		queryKey: ["wishlist", "products", page],
		queryFn: () => fetchWishlistProducts(page),
	})
}