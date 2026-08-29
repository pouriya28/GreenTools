import { useState } from "react"
import { CheckCircle2, Loader2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getApiErrorMessage } from "@/shared/lib/apiError"
import {
  useConfirmCurrentExchangeRate,
  useCurrentExchangeRate,
  useFetchNowExchangeRate,
} from "../hooks/useExchangeRateMutations"
import { ConfirmActionDialog } from "./shared/ConfirmActionDialog"
import { ExchangeRateStatusBadge } from "./shared/ExchangeRateStatusBadge"
import { InlineErrorBanner } from "./shared/InlineErrorBanner"

interface ExchangeRateStatusCardProps {
  onBatchCreated: (batchId: string) => void
}

type PendingAction = "fetch-now" | "confirm" | null

// یک کارت مستقل برای وضعیت نرخ ارز فعلی + دو اکشن حساس مرتبط به آن
// («fetch-now» و «تایید نرخ فعلی») ، جدا از دیالوگ ثبت دستی - چون طبق تصمیم
// تایید‌شده، این دو عملیات هم کاملاً مستقل از ثبت دستی و بازبینی پیشنهاد قیمت
// هستند (همان exchange-rates.manage permission، نه prices.review). هر دو پشت
// ConfirmActionDialog مشترک قرار گرفتن (اولویت امنیتی پروژه: جلوگیری
// از خطای انسانی روی عملیات‌های غیرقابل‌بازگشت).
export function ExchangeRateStatusCard({ onBatchCreated }: ExchangeRateStatusCardProps) {
  const { data: currentRate, isLoading, isError, error } = useCurrentExchangeRate()
  const fetchNowMutation = useFetchNowExchangeRate()
  const confirmMutation = useConfirmCurrentExchangeRate()
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const isBusy = fetchNowMutation.isPending || confirmMutation.isPending
  const canConfirm = currentRate != null && currentRate.status === "pending_review"

  async function handleConfirmPendingAction() {
    setActionError(null)
    try {
      if (pendingAction === "fetch-now") {
        const result = await fetchNowMutation.mutateAsync()
        onBatchCreated(result.batch_id)
      } else if (pendingAction === "confirm") {
        await confirmMutation.mutateAsync()
      }
      setPendingAction(null)
    } catch (err) {
      setActionError(
        getApiErrorMessage(
          err,
          pendingAction === "fetch-now" ? "دریافت آنی نرخ ناموفق بود." : "تایید نرخ ارز ناموفق بود.",
        ),
      )
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setPendingAction(null)
      setActionError(null)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-1 p-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-text-2">نرخ ارز فعلی</span>
          {isLoading ? (
            <span className="flex items-center gap-2 text-sm text-text-3">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> در حال بارگذاری...
            </span>
          ) : isError ? (
            <span className="text-sm text-danger">{getApiErrorMessage(error, "دریافت نرخ ارز ناموفق بود.")}</span>
          ) : currentRate ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold text-text-1">
                {Number(currentRate.rate).toLocaleString("fa-IR")}
              </span>
              <span className="text-xs text-text-3">تومان به ازای هر دلار</span>
              <ExchangeRateStatusBadge status={currentRate.status} />
            </div>
          ) : (
            <span className="text-sm text-text-3">هنوز هیچ نرخ ارزی ثبت نشده.</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPendingAction("fetch-now")}
            disabled={isBusy}
          >
            <Zap className="h-3.5 w-3.5" />
            دریافت آنی از API
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPendingAction("confirm")}
            disabled={isBusy || !canConfirm}
            title={!canConfirm ? "فقط وقتی نرخ در انتظار بررسی است قابل تایید است" : undefined}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            تایید نرخ فعلی
          </Button>
        </div>
      </div>

      {actionError && <InlineErrorBanner message={actionError} />}

      <ConfirmActionDialog
        open={pendingAction !== null}
        onOpenChange={handleOpenChange}
        title={pendingAction === "fetch-now" ? "دریافت آنی نرخ از API" : "تایید نرخ ارز فعلی"}
        description={
          pendingAction === "fetch-now"
            ? "نرخ لحظه‌ای از API نوسان دریافت می‌شه و یک batch پیشنهاد قیمت جدید (در انتظار بررسی) می‌سازه. این عملیات محدود به تعداد کمی در ساعت است. مطمئنی؟"
            : "جدیدترین نرخ ثبت‌شده مستقیماً applied می‌شه و به‌عنوان نرخ فعال برای قیمت‌گذاری محصولات جدید استفاده می‌شه، حتی اگر پیشنهادهای قیمت آن هنوز بررسی نشده باشند. مطمئنی؟"
        }
        confirmLabel="تایید نهایی"
        isBusy={isBusy}
        errorMessage={null}
        onConfirm={handleConfirmPendingAction}
      />
    </div>
  )
}
