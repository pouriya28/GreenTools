// src/features/orders/constants/orderStatus.ts
const ORDER_STATUS_LABELS: Record<string, string> = {
	pending_payment: "در انتظار پرداخت",
	paid: "پرداخت‌شده",
	processing: "در حال پردازش",
	packed: "بسته‌بندی‌شده",
	shipped: "ارسال‌شده",
	delivered: "تحویل داده‌شده",
	cancelled: "لغو شده",
}

const ORDER_STATUS_COLORS: Record<string, string> = {
	pending_payment: "text-warning bg-warning/10",
	paid: "text-info bg-info/10",
	processing: "text-info bg-info/10",
	packed: "text-primary bg-primary/10",
	shipped: "text-primary bg-primary/10",
	delivered: "text-success bg-success/10",
	cancelled: "text-error bg-error/10",
}

// اگه مقدار enum بک‌اند دقیقاً یکی از این کلیدها نبود، خام همون مقدار نمایش داده می‌شه (کرش نمی‌کنه)
export function getOrderStatusLabel(status: string): string {
	return ORDER_STATUS_LABELS[status] ?? status
}

export function getOrderStatusColor(status: string): string {
	return ORDER_STATUS_COLORS[status] ?? "text-text-secondary bg-surface"
}