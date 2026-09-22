// src/features/wishlist/hooks/useWishlistProductIds.ts
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/store/authStore"
import { fetchWishlistProductIds } from "../api/wishlistApi"

export function useWishlistProductIds() {
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

	return useQuery({
		queryKey: ["wishlist", "product-ids"],
		queryFn: fetchWishlistProductIds,
		enabled: isAuthenticated,
		staleTime: 60_000,
	})
}