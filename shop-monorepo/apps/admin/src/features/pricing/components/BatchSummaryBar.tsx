import { useState } from "react"
import type { KeyboardEvent } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getApiErrorMessage } from "@/shared/lib/apiError"
import { downloadCsvBlob, exportPriceProposalsCsv } from "../api/pricingApi"
import { useApproveProposalBatch, useRejectProposalBatch } from "../hooks/usePricingMutations"
import { ConfirmActionDialog } from "./shared/ConfirmActionDialog"
import { InlineErrorBanner } from "./shared/InlineErrorBanner"
import type { PriceProposal } from "../types"

interface BatchSummaryBarProps {
  batchId: string
  batchIdInput: string
  onBatchIdInputChange: (value: string) => void
  onBatchIdSubmit: () => void
  proposals: PriceProposal[]
}

// نوار خلاصه‌ی batch: انتخاب batch، خروجی CSV، و تایید/رد دسته‌جمعی — این
// عملیات‌ها حساس و قابل‌برگشت‌ناشدن، پس هر دو پشت یک دیالوگ تایید مشترک
// (ConfirmActionDialog) قرار گرفتن (جلوگیری از خطای انسانی طبق اولویت امنیتی
// پروژه).
export function BatchSummaryBar({
  batchId,
  batchIdInput,
  onBatchIdInputChange,
  onBatchIdSubmit,
  proposals,
}: BatchSummaryBarProps) {
  const approveBatchMutation = useApproveProposalBatch()
  const rejectBatchMutation = useRejectProposalBatch()
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pendingCount = proposals.filter((p) => p.status === "pending_review" || p.status === "edited").length
  const isBusy = approveBatchMutation.isPending || rejectBatchMutation.isPending

  async function handleConfirmBatchAction() {
    if (!confirmAction || !batchId) return
    setError(null)
    try {
      if (confirmAction === "approve") {
        await approveBatchMutation.mutateAsync(batchId)
      } else {
        await rejectBatchMutation.mutateAsync(batchId)
      }
      setConfirmAction(null)
    } catch (err) {
      setError(getApiErrorMessage(err, "عملیات دسته‌جمعی ناموفق بود."))
      setConfirmAction(null)
    }
  }

  async function handleExport() {
    if (!batchId) return
    setIsExporting(true)
    setError(null)
    try {
      const blob = await exportPriceProposalsCsv(batchId)
      downloadCsvBlob(blob, batchId)
    } catch (err) {
      setError(getApiErrorMessage(err, "دریافت خروجی CSV ناموفق بود."))
    } finally {
      setIsExporting(false)
    }
  }

  function handleBatchIdInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      onBatchIdSubmit()
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-1 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-text-2">شناسه Batch:</span>
        <Input
          value={batchIdInput}
          onChange={(e) => onBatchIdInputChange(e.target.value)}
          onKeyDown={handleBatchIdInputKeyDown}
          placeholder="خالی = آخرین batch"
          className="h-8 w-72 font-mono text-xs"
        />
        <Button type="button" variant="outline" size="sm" onClick={onBatchIdSubmit}>
          نمایش
        </Button>

        <div className="mr-auto flex items-center gap-2">
          <span className="rounded-full bg-bg-2 px-2.5 py-1 text-xs font-medium text-text-2">
            {pendingCount} پیشنهاد در انتظار بررسی
          </span>
          <Button type="button" variant="outline" size="sm" onClick={handleExport} disabled={!batchId || isExporting}>
            {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            خروجی CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfirmAction("approve")}
            disabled={!batchId || pendingCount === 0 || isBusy}
          >
            تایید کل batch
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-danger/10 hover:text-danger"
            onClick={() => setConfirmAction("reject")}
            disabled={!batchId || pendingCount === 0 || isBusy}
          >
            رد کل batch
          </Button>
        </div>
      </div>

      {error && <InlineErrorBanner message={error} />}

      <ConfirmActionDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction === "approve" ? "تایید کل batch" : "رد کل batch"}
        description={`این عملیات روی ${pendingCount} پیشنهاد قیمت در انتظار بررسی اعمال می‌شه و قابل بازگشت نیست. مطمئنی؟`}
        confirmLabel="تایید نهایی"
        destructive={confirmAction === "reject"}
        isBusy={isBusy}
        onConfirm={handleConfirmBatchAction}
      />
    </div>
  )
}
