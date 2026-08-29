import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getApiErrorMessage } from "@/shared/lib/apiError"
import { usePriceProposals } from "../hooks/usePriceProposals"
import { PriceProposalTable } from "../components/PriceProposalTable"
import { PriceProposalTableSkeleton } from "../components/PriceProposalTableSkeleton"
import { BatchSummaryBar } from "../components/BatchSummaryBar"
import { ManualOverrideDialog } from "../components/ManualOverrideDialog"
import { ExchangeRateStatusCard } from "../components/ExchangeRateStatusCard"
import { ExchangeRateScheduleManager } from "../components/ExchangeRateScheduleManager"
import { InlineErrorBanner } from "../components/shared/InlineErrorBanner"
import { InlineSuccessBanner } from "../components/shared/InlineSuccessBanner"

export default function PricingPage() {
  const [batchId, setBatchId] = useState("")
  const [batchIdInput, setBatchIdInput] = useState("")
  const [isOverrideOpen, setIsOverrideOpen] = useState(false)
  const [isScheduleManagerOpen, setIsScheduleManagerOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Empty batch_id = the backend (PriceProposalController::index) returns the latest batch on its own.
  const { data, isLoading, isError, error } = usePriceProposals({ batch_id: batchId || undefined, per_page: 200 })

  function handleOverrideSuccess(newBatchId: string) {
    setBatchId(newBatchId)
    setBatchIdInput(newBatchId)
    setSuccessMessage(
      `نرخ ارز جدید ثبت شد و batch «${newBatchId}» از پیشنهادهای قیمت ساخته شد — برای اعمال روی قیمت محصولات، پیشنهادها رو در جدول پایین بررسی و تایید کن.`,
    )
  }

  // fetchNow (دریافت آنی از API) هم دقیقاً مثل ثبت دستی نرخ فقط یک batch
  // pending_review می‌سازد، پس همان مسیر موفقیت (نمایش batch در جدول پایین) را
  // به اشتراک می‌گذارد.
  function handleFetchNowBatchCreated(newBatchId: string) {
    setBatchId(newBatchId)
    setBatchIdInput(newBatchId)
    setSuccessMessage(
      `نرخ از API دریافت شد و batch «${newBatchId}» از پیشنهادهای قیمت ساخته شد — برای اعمال روی قیمت محصولات، پیشنهادها رو در جدول پایین بررسی و تایید کن.`,
    )
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
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setIsScheduleManagerOpen((prev) => !prev)}>
            زمان‌بندی دریافت خودکار
          </Button>
          <Button type="button" onClick={() => setIsOverrideOpen(true)}>
            <Plus className="h-4 w-4" />
            ثبت نرخ ارز جدید
          </Button>
        </div>
      </div>

      {successMessage && <InlineSuccessBanner message={successMessage} />}

      <ExchangeRateStatusCard onBatchCreated={handleFetchNowBatchCreated} />

      {isScheduleManagerOpen && <ExchangeRateScheduleManager />}

      <BatchSummaryBar
        batchId={resolvedBatchId}
        batchIdInput={batchIdInput}
        onBatchIdInputChange={setBatchIdInput}
        onBatchIdSubmit={() => {
          setBatchId(batchIdInput.trim())
          setSuccessMessage(null)
        }}
        proposals={proposals}
      />

      {isLoading ? (
        <PriceProposalTableSkeleton />
      ) : isError ? (
        <InlineErrorBanner message={getApiErrorMessage(error, "دریافت پیشنهادهای قیمت ناموفق بود.")} />
      ) : (
        <PriceProposalTable proposals={proposals} />
      )}

      <ManualOverrideDialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen} onSuccess={handleOverrideSuccess} />
    </div>
  )
}
