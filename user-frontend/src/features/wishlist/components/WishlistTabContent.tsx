// src/features/wishlist/components/WishlistTabContent.tsx
import { PageLoader } from "@/shared/components/PageLoader"
import { ProductCard } from "@/features/products/components/ProductCard/ProductCard"
import { useWishlistProducts } from "../hooks/useWishlistProducts"

export function WishlistTabContent() {
	const { data, isLoading, isError } = useWishlistProducts()

	if (isLoading) return <PageLoader />
	if (isError) return <div className="py-16 text-center text-error">دریافت علاقه‌مندی‌ها با خطا مواجه شد.</div>

	const products = data?.data ?? []

	return products.length === 0 ? (
		<p className="text-text-secondary">هنوز محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید.</p>
	) : (
		<div className="flex flex-wrap gap-6">
			{products.map((product) => (
				<ProductCard key={product.id} product={product} />
			))}
		</div>
	)
}