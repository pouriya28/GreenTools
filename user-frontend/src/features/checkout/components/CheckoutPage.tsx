import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AddressList } from "@/features/address"
import { useCart } from "@/features/cart/hooks/useCart"
import { formatToman } from "@/features/cart/utils/formatToman"
import { useCheckout } from "../hooks/useCheckout"
import { ApiError } from "@/shared/error/ApiError"

/**
 * مرحلهٔ انتخاب آدرس + تایید نهایی سفارش. توسط دکمهٔ "ثبت و ادامهٔ سفارش" داخل
 * `CartSummary.tsx` با `navigate("/checkout")` به اینجا می‌رسد.
 */
export function CheckoutPage() {
	const navigate = useNavigate()
	const { data: cart, isLoading: isCartLoading, isError: isCartError } = useCart()
	const checkout = useCheckout()

	const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
	const [orderResult, setOrderResult] = useState<{ orderId: number } | null>(null)

	const errorMessage =
		checkout.isError && checkout.error instanceof ApiError ? checkout.error.message : null

	async function handleConfirm() {
		if (!selectedAddressId) return
		try {
			const result = await checkout.mutateAsync(selectedAddressId)
			setOrderResult({ orderId: result.order_id })
		} catch {
			// خطای فیلدی (422) بالا نمایش داده می‌شود، بقیه توسط axios interceptor toast می‌شوند.
		}
	}

	if (orderResult) {
		return (
			<div className="mx-auto max-w-lg px-4 py-16 text-center" dir="rtl">
				<h1 className="mb-2 text-xl font-bold text-text">سفارش شما دریافت شد</h1>
				<p className="mb-6 text-text-secondary">کد سفارش شما: {orderResult.orderId}</p>
				<button
					type="button"
					className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white"
					onClick={() => navigate("/")}
				>
					بازگشت به فروشگاه
				</button>
			</div>
		)
	}

	if (isCartLoading) {
		return <p className="px-4 py-16 text-center text-text-secondary">در حال بارگذاری…</p>
	}

	if (isCartError || !cart || cart.items.length === 0) {
		return (
			<div className="mx-auto max-w-lg px-4 py-16 text-center text-text-secondary" dir="rtl">
				سبد خرید شما خالی است یا در دریافتش مشکلی پیش آمد.
				<button type="button" className="mt-4 block text-primary underline" onClick={() => navigate("/cart")}>
					بازگشت به سبد خرید
				</button>
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-6xl px-4 py-8" dir="rtl">
			<h1 className="mb-6 text-xl font-bold text-text sm:text-2xl">تکمیل خرید</h1>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
				<div className="flex flex-col gap-4">
					<h2 className="font-bold text-text">انتخاب آدرس تحویل</h2>
					<AddressList
						selectable
						selectedAddressId={selectedAddressId}
						onSelect={(address) => setSelectedAddressId(address.id)}
					/>
				</div>

				<div className="flex flex-col gap-4 rounded-xl border border-border bg-bg-2 p-5">
					<h2 className="font-bold text-text">خلاصه سفارش</h2>
					<div className="flex items-center justify-between text-sm">
						<span className="text-text-secondary">تعداد اقلام</span>
						<span className="text-text">{cart.items_count.toLocaleString("fa-IR")}</span>
					</div>
					<div className="h-px bg-border" />
					<div className="flex items-center justify-between text-base">
						<span className="font-bold text-text">جمع کل</span>
						<span className="font-bold text-primary">{formatToman(cart.subtotal)}</span>
					</div>

					{errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
					{!selectedAddressId && (
						<p className="text-sm text-text-secondary">ابتدا یک آدرس تحویل انتخاب کنید.</p>
					)}

					<button
						type="button"
						disabled={!selectedAddressId || checkout.isPending}
						onClick={handleConfirm}
						className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
					>
						{checkout.isPending ? "در حال در و ارسال…" : "تایید نهایی و ثبت سفارش"}
					</button>
				</div>
			</div>
		</div>
	)
}
