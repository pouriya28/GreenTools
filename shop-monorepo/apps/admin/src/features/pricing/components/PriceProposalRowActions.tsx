import { useState } from "react"
import { Check, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getApiErrorMessage } from "@/shared/lib/apiError"
import { useApprovePriceProposal, useRejectPriceProposal } from "../hooks/usePricingMutations"
import type { PriceProposal } from "../types"

interface PriceProposalRowActionsProps {
  proposal: PriceProposal
  onError: (message: string) => void
}

// طبق guardNotFinal سمت بک‌اند، پیشنهادی که approved/rejected شده دیگه قابل
// approve/reject/edit دوباره نیست (۴۰۹ PRICE_PROPOSAL_ALREADY_REVIEWED)؛
// دکمه‌ها همین سمت هم غیرفعال می‌شن تا کاربر زودتر بفهمه و درخواست بی‌فایده
// به سرور نره.
const FINAL_STATUSES = new Set(["approved", "rejected"])

export function PriceProposalRowActions({ proposal, onError }: PriceProposalRowActionsProps) {
  const approveMutation = useApprovePriceProposal()
  const rejectMutation = useRejectPriceProposal()
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null)

  const isFinal = FINAL_STATUSES.has(proposal.status)
  const isBusy = approveMutation.isPending || rejectMutation.isPending

  async function handleApprove() {
    setPendingAction("approve")
    try {
      await approveMutation.mutateAsync(proposal.id)
    } catch (err) {
      onError(getApiErrorMessage(err, "تایید پیشنهاد قیمت ناموفق بود."))
    } finally {
      setPendingAction(null)
    }
  }

  async function handleReject() {
    setPendingAction("reject")
    try {
      await rejectMutation.mutateAsync(proposal.id)
    } catch (err) {
      onError(getApiErrorMessage(err, "رد پیشنهاد قیمت ناموفق بود."))
    } finally {
      setPendingAction(null)
    }
  }

  if (isFinal) {
    return <span className="text-xs text-text-3">قطعی شده</span>
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button type="button" variant="outline" size="sm" onClick={handleApprove} disabled={isBusy}>
        {pendingAction === "approve" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        تایید
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-danger hover:bg-danger/10 hover:text-danger"
        onClick={handleReject}
        disabled={isBusy}
      >
        {pendingAction === "reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        رد
      </Button>
    </div>
  )
}
