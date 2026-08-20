import { useState } from "react"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getApiErrorMessage } from "@/shared/lib/apiError"
import { usePriceProposals } from "../hooks/usePriceProposals"
import { PriceProposalTable } from "../components/PriceProposalTable"
import { BatchSummaryBar } from "../components/BatchSummaryBar"
import { ManualOverrideDialog } from "../components/ManualOverrideDialog"
import { ExchangeRateBlockedNotice } from "../components/ExchangeRateBlockedNotice"

export default function PricingPage() {
  const [batchId, setBatchId] = useState("")
  const [batchIdInput, setBatchIdInput] = useState("")
  const [isOverrideOpen, setIsOverrideOpen] = useState(false)

  // batch_id خالی = بک‌اند طبق PriceProposalController::index خودش آخرین batch رو
  // برمی‌گردوند.
  const { data, isLoading, isError, error } = usePriceProposals({ batch_id: batchId || undefined, per_page: 200 })

  function handleOverrideSuccess(newBatchId: string) {
    setBatchId(newBatchId)
    setBatchIdInput(newBatchId)
  }

  const proposals = data?.data ?? []
  const resolvedBatchId = batchId || proposals[0]?.batch_id || ""

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-1">مدیریت نرخ ارز و قیمت‌ها</h1>
          <p className="text-sm text-text-2">ثبت دستی نرخ ارز و بررسی/تایید پیشنهادهای قیمت محصولات دلاری.</p>
        </div>
        <Button type="button" onClick={() => setIsOverrideOpen(true)}>
          <Plus className="h-4 w-4" />
          ثبت نرخ ارز جدید
        </Button>
      </div>

      <ExchangeRateBlockedNotice />

      <BatchSummaryBar
        batchId={resolvedBatchId}
        batchIdInput={batchIdInput}
        onBatchIdInputChange={setBatchIdInput}
        onBatchIdSubmit={() => setBatchId(batchIdInput.trim())}
        proposals={proposals}
      />

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-text-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          در حال بارگذاری...
        </div>
      ) : isError ? (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {getApiErrorMessage(error, "دریافت پیشنهادهای قیمت ناموفق بود."}
        </div>
      ) : (
        <PriceProposalTable proposals={proposals} />
      )}

      <ManualOverrideDialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen} onSuccess={handleOverrideSuccess} />
    </div>
  )
}
