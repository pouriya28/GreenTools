import { Badge } from "@/components/ui/badge"
import type { PriceProposalStatus } from "../types"

const STATUS_LABELS: Record<PriceProposalStatus, string> = {
  pending_review: "در انتظار بررسی",
  edited: "اصلاح‌شده (در انتظار تایید)",
  approved: "تایید شده",
  rejected: "رد شده",
}

const STATUS_VARIANT: Record<PriceProposalStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending_review: "secondary",
  edited: "outline",
  approved: "default",
  rejected: "destructive",
}

interface PriceProposalStatusBadgeProps {
  status: PriceProposalStatus
}

export function PriceProposalStatusBadge({ status }: PriceProposalStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>
}
