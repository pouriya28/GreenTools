import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AddressList } from "@/features/address"
import { ShippingMethodList } from "@/features/shipping"
import type { ShippingMethod } from "@/features/shipping/types/Shipping"
import { useShippingMethods } from "@/features/shipping/hooks/useShippingMethods"
import { useShippingQuotes } from "@/features/shipping/hooks/useShippingQuotes"
import { OrderSummary } from "@/features/cart/components/OrderSummary"
import { useCart } from "@/features/cart/hooks/useCart"
import { useCheckout } from "../hooks/useCheckout"
import { ApiError } from "@/shared/error/ApiError"

/** مرحلهٔ انتخاب آدرس + روش ارسال + تایید نهایی سفارش. */
export function CheckoutPage() {
    const navigate = useNavigate()
    const { data: cart, isLoading: isCartLoading, isError: isCartError } = useCart()
    const checkout = useCheckout()

    const { data: shippingMethods } = useShippingMethods()
    const shippingMethodIds = shippingMethods?.map((m) => m.id) ?? []
    const { quotesById } = useShippingQuotes(shippingMethodIds)

    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
    const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(null)
    const [orderResult, setOrderResult] = useState<{ orderId: number } | null>(null)

    const selectedQuote = selectedShippingMethod ? quotesById[selectedShippingMethod.id] : undefined

    const errorMessage =
        checkout.isError && checkout.error instanceof ApiError ? checkout.error.message : null
    const shippingErrorMessage = selectedQuote?.isError ? "دریافت هزینه‌ی ارسال با خطا مواجه شد." : null

    function handleSelectShippingMethod(method: ShippingMethod) {
        setSelectedShippingMethod(method)
    }

    async function handleConfirm() {
        if (!selectedAddressId || !selectedShippingMethod) return
        try {
            const result = await checkout.mutateAsync({
                addressId: selectedAddressId,
                shippingMethodId: selectedShippingMethod.id,
            })
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
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                        <h2 className="font-bold text-text">انتخاب آدرس تحویل</h2>
                        <AddressList
                            selectable
                            selectedAddressId={selectedAddressId ?? undefined}
                            onSelect={(address) => setSelectedAddressId(address.id)}
                        />
                    </div>
                    <div className="flex flex-col gap-4">
                        <h2 className="font-bold text-text">انتخاب روش ارسال</h2>
                        <ShippingMethodList
                            selectedMethodId={selectedShippingMethod?.id ?? null}
                            onSelect={handleSelectShippingMethod}
                        />
                        {shippingErrorMessage && <p className="text-sm text-red-500">{shippingErrorMessage}</p>}
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <OrderSummary
                        cart={cart}
                        shippingCost={selectedShippingMethod ? selectedQuote?.data?.cost : undefined}
                        shippingMethodName={selectedShippingMethod?.name}
                        isShippingLoading={Boolean(selectedShippingMethod) && Boolean(selectedQuote?.isLoading)}
                    />
                    {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
                    {!selectedAddressId && (
                        <p className="text-sm text-text-secondary">ابتدا یک آدرس تحویل انتخاب کنید.</p>
                    )}
                    {selectedAddressId && !selectedShippingMethod && (
                        <p className="text-sm text-text-secondary">یک روش ارسال انتخاب کنید.</p>
                    )}
                    <button
                        type="button"
                        disabled={!selectedAddressId || !selectedShippingMethod || Boolean(selectedQuote?.isLoading) || checkout.isPending}
                        onClick={handleConfirm}
                        className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {checkout.isPending ? "در حال ثبت و ارسال…" : "تایید نهایی و ثبت سفارش"}
                    </button>
                </div>
            </div>
        </div>
    )
}