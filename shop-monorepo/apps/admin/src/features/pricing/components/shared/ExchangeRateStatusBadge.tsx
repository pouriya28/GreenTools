import { Badge } from "@/components/ui/badge"
import type { ExchangeRateStatus } from "../../types"

const STATUS_LABELS: Record<ExchangeRateStatus, string> = {
  pending_review: "در انتظار بررسی",
  applied: "اعمال‌شده",
  rejected: "رد‌شده",
}

const STATUS_VARIANT: Record<ExchangeRateStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending_review: "secondary",
  applied: "default",
  rejected: "destructive",
}

interface ExchangeRateStatusBadgeProps {
  status: ExchangeRateStatus
}

// Small, reusable badge for ExchangeRate.status - shared by the status card
// and (indirectly, via the same label set) the manual-override dialog, so the
// Persian labels/colors for this status only need to be defined once.
export function ExchangeRateStatusBadge({ status }: ExchangeRateStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>
}
