// src/features/wishlist/pages/WishlistPage.tsx
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { useWishlistProducts } from "../hooks/useWishlistProducts"
import { ProductCard } from "@/features/products/components/ProductCard/ProductCard"
import { PageLoader } from "@/shared/components/PageLoader"

export function WishlistPage() {
	const navigate = useNavigate()
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
	const isInitialized = useAuthStore((s) => s.isInitialized)
	const { data, isLoading, isError } = useWishlistProducts()

	useEffect(() => {
		if (isInitialized && !isAuthenticated) {
			navigate("/login")
		}
	}, [isInitialized, isAuthenticated, navigate])

	if (isLoading) return <PageLoader />

	if (isError) {
		return <div className="py-16 text-center text-error">دریافت علاقه‌مندی‌ها با خطا مواجه شد.</div>
	}

	const products = data?.data ?? []

	return (
		<div className="flex flex-col gap-6 p-6" dir="rtl">
			<h1 className="text-2xl font-bold text-text">علاقه‌مندی‌های من</h1>
			{products.length === 0 ? (
				<p className="text-text-secondary">هنوز محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید.</p>
			) : (
				<div className="flex flex-wrap gap-6">
					{products.map((product) => (
						<ProductCard key={product.id} product={product} />
					))}
				</div>
			)}
		</div>
	)
}