// src/features/cart/components/OrderSummary.tsx
import type { Cart, CartItem } from "../types/Cart"
import { formatToman } from "../utils/formatToman"

interface OrderSummaryProps {
	cart: Cart
	/** برای سفارشی‌سازی ظرف بیرونی در جاهای مختلف استفاده (مثلاً حذف بوردر در یک مودال) */
	className?: string
	/** عنوان بالای باکس؛ در صورت نیاز به مخفی‌کردن مقدار "" بدهید */
	title?: string
}

/**
 * نمایش فقط‌خواندنیِ اقلام سبد/سفارش + جمع کل.
 * بدون هیچ اکشنی (دکمه/ناوبری) تا در هر جای اپ (چک‌اوت، صفحه سبد، مودال پیش‌نمایش و…) قابل استفاده باشد.
 */
export function OrderSummary({ cart, className = "", title = "خلاصه سفارش" }: OrderSummaryProps) {
	return (
		<div
			className={`flex flex-col gap-4 rounded-xl border border-border bg-bg-2 p-5 ${className}`}
			dir="rtl"
		>
			{title && <h2 className="font-bold text-text">{title}</h2>}

			<ul className="flex max-h-80 flex-col gap-3 overflow-y-auto pl-1 sm:max-h-96">
				{cart.items.map((item) => (
					<OrderSummaryItem key={item.id} item={item} />
				))}
			</ul>

			<div className="h-px bg-border" />

			<div className="flex items-center justify-between text-sm">
				<span className="text-text-secondary">تعداد اقلام</span>
				<span className="text-text">{cart.items_count.toLocaleString("fa-IR")}</span>
			</div>

			<div className="flex items-center justify-between text-base">
				<span className="font-bold text-text">جمع کل</span>
				<span className="font-bold text-primary">{formatToman(cart.subtotal)}</span>
			</div>
		</div>
	)
}

function OrderSummaryItem({ item }: { item: CartItem }) {
	const isRemoved = !item.product_name
	const hasWarning = isRemoved || !item.in_stock || item.price_changed

	return (
		<li className="flex items-center gap-3">
			<div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-bg-3">
				{item.image_url ? (
					<img
						src={item.image_url}
						alt={item.product_name ?? ""}
						className="h-full w-full object-cover"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center text-center text-[10px] leading-tight text-text-secondary">
						بدون
						<br />
						تصویر
					</div>
				)}
			</div>

			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<p className="truncate text-sm font-medium text-text">
					{item.product_name ?? "محصول حذف‌شده"}
				</p>

				<div className="flex items-center gap-1.5 text-xs text-text-secondary">
					<span>{item.quantity.toLocaleString("fa-IR")} ×</span>
					<span>{formatToman(item.unit_price - item.unit_discount)}</span>
				</div>

				{hasWarning && (
					<div className="flex flex-wrap gap-1">
						{isRemoved && (
							<span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-500">
								محصول حذف شده
							</span>
						)}
						{!item.in_stock && !isRemoved && (
							<span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-500">
								موجودی ناکافی
							</span>
						)}
						{item.price_changed && !isRemoved && (
							<span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-medium text-yellow-600">
								قیمت تغییر کرده
							</span>
						)}
					</div>
				)}
			</div>

			<span className="shrink-0 text-sm font-bold text-text">{formatToman(item.line_total)}</span>
		</li>
	)
}