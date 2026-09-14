// src/features/dashboard/pages/DashboardPage.tsx
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { LoyaltyTab } from "@/features/loyalty/components/LoyaltyTab"
import { OrdersTab } from "@/features/orders/components/OrdersTab"
import { WishlistTabContent } from "@/features/wishlist/components/WishlistTabContent"

type TabKey = "loyalty" | "addresses" | "orders" | "wishlist"

const TABS: Array<{ key: TabKey; label: string }> = [
	{ key: "loyalty", label: "سطح من" },
	{ key: "addresses", label: "آدرس‌ها" },
	{ key: "orders", label: "سفارش‌ها" },
	{ key: "wishlist", label: "علاقه‌مندی‌ها" },
]

export function DashboardPage() {
	const navigate = useNavigate()
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
	const isInitialized = useAuthStore((s) => s.isInitialized)
	const [activeTab, setActiveTab] = useState<TabKey>("loyalty")

	useEffect(() => {
		if (isInitialized && !isAuthenticated) navigate("/login")
	}, [isInitialized, isAuthenticated, navigate])

	return (
		<div className="max-w-4xl mx-auto p-4" dir="rtl">
			<div className="flex overflow-x-auto gap-2 border-b border-border mb-4">
				{TABS.map((tab) => (
					<button
						key={tab.key}
						onClick={() => setActiveTab(tab.key)}
						className={`px-4 py-3 whitespace-nowrap text-sm font-semibold transition border-b-2 ${
							activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{activeTab === "loyalty" && <LoyaltyTab />}
			{activeTab === "addresses" && <div className="text-text-secondary">اینجا کامپوننت آدرس تو قرار می‌گیره — پایین توضیح دادم</div>}
			{activeTab === "orders" && <OrdersTab />}
			{activeTab === "wishlist" && <WishlistTabContent />}
		</div>
	)
}