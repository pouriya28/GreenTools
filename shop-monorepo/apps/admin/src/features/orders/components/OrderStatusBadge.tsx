import { Badge } from "@/components/ui/badge"
import { ORDER_STATUS_LABELS, type OrderStatus } from "../types/Order"

// "outline" تنها variant خنثی و معتبر Badge است (پایه‌اش border-border/text-foreground)؛
// برای هر وضعیت با className رنگ کامل (border/bg/text) را override می‌کنیم.
const STATUS_STYLES: Record<OrderStatus, string> = {
    pending_payment: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    paid: "border-sky-500/30 bg-sky-500/10 text-sky-400",
    processing: "border-violet-500/30 bg-violet-500/10 text-violet-400",
    packed: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
    shipped: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
    delivered: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    cancelled: "border-red-500/30 bg-red-500/10 text-red-400",
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
    return (
        <Badge variant="outline" className={STATUS_STYLES[status]}>
            {ORDER_STATUS_LABELS[status]}
        </Badge>
    )
}