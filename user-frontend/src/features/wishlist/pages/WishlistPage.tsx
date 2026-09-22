// src/features/wishlist/pages/WishlistPage.tsx
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { WishlistTabContent } from "../components/WishlistTabContent"

export function WishlistPage() {
	const navigate = useNavigate()
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
	const isInitialized = useAuthStore((s) => s.isInitialized)

	useEffect(() => {
		if (isInitialized && !isAuthenticated) navigate("/login")
	}, [isInitialized, isAuthenticated, navigate])

	return (
		<div className="flex flex-col gap-6 p-6" dir="rtl">
			<h1 className="text-2xl font-bold text-text">علاقه‌مندی‌های من</h1>
			<WishlistTabContent />
		</div>
	)
}