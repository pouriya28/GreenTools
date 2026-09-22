// src/features/wishlist/components/WishlistButton.tsx
import { FaHeart, FaRegHeart } from "react-icons/fa"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { useWishlistProductIds } from "../hooks/useWishlistProductIds"
import { useToggleWishlist } from "../hooks/useToggleWishlist"

type WishlistButtonProps = {
	productId: number
	className?: string
}

export function WishlistButton({ productId, className }: WishlistButtonProps) {
	const navigate = useNavigate()
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
	const { data: wishlistedIds } = useWishlistProductIds()
	const toggleWishlist = useToggleWishlist()

	const isWishlisted = wishlistedIds?.includes(productId) ?? false

	function handleClick(event: React.MouseEvent) {
		event.stopPropagation()
		event.preventDefault()

		if (!isAuthenticated) {
			navigate("/login")
			return
		}

		toggleWishlist.mutate({ productId, isWishlisted })
	}

	return (
		<button
			type="button"
			aria-label={isWishlisted ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
			aria-pressed={isWishlisted}
			disabled={toggleWishlist.isPending}
			onClick={handleClick}
			className={`w-11 h-11 rounded-full bg-surface flex items-center justify-center hover:scale-110 transition disabled:opacity-50 ${
				isWishlisted ? "text-error" : "text-text-secondary"
			} ${className ?? ""}`}
		>
			{isWishlisted ? <FaHeart /> : <FaRegHeart />}
		</button>
	)
}