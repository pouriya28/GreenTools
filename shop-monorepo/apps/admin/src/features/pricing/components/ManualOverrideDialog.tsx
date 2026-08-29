import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage } from "@/shared/lib/apiError"
import { fetchCurrentExchangeRate } from "../api/exchangeRateApi"
import { manualOverrideSchema, type ManualOverrideFormValues } from "../schema"
import { useSubmitManualOverride } from "../hooks/useExchangeRateMutations"
import { NumericInput } from "./shared/NumericInput"

const REASON_MAX_LENGTH = 500

// Persian labels for the ExchangeRate.status values returned by GET
// /admin/prices/current, shown as a small hint after fetching.
const RATE_STATUS_LABEL: Record<string, string> = {
  applied: "اعمال‌شده",
  pending_review: "در انتظار بررسی",
  rejected: "رد‌شده",
}

interface ManualOverrideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (batchId: string) => void
}

// A sensitive, low-frequency operation (server-side throttle: 5 per 60
// minutes) that directly sets the exchange rate manually — an explicit
// confirmation step (showing a summary before the real submit) was added to
// guard against human error (e.g. an accidental click). The "back" button on
// that confirm step is auto-focused so an accidental Enter keypress can never
// submit the sensitive request by itself.
export function ManualOverrideDialog({ open, onOpenChange, onSuccess }: ManualOverrideDialogProps) {
  const [step, setStep] = useState<"form" | "confirm">("form")
  const [formError, setFormError] = useState<string | null>(null)
  const [pendingValues, setPendingValues] = useState<ManualOverrideFormValues | null>(null)
  const [isFetchingCurrent, setIsFetchingCurrent] = useState(false)
  const [currentRateHint, setCurrentRateHint] = useState<string | null>(null)
  const submitMutation = useSubmitManualOverride()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ManualOverrideFormValues>({
    resolver: zodResolver(manualOverrideSchema),
    defaultValues: { reason: "" },
  })

  const reasonLength = watch("reason")?.length ?? 0

  function handleClose(next: boolean) {
    if (submitMutation.isPending) return
    if (!next) {
      reset()
      setStep("form")
      setFormError(null)
      setPendingValues(null)
      setCurrentRateHint(null)
    }
    onOpenChange(next)
  }

  // Bug fix: this used to read the raw rate straight out of getValues() (a
  // plain string once valueAsNumber is removed below). Capturing the
  // resolver's already-validated, coerced-to-number output here - exactly
  // what handleSubmit hands to its callback - means both the confirm screen
  // and the final request always get a real number, never "NaN" or a string.
  function goToConfirm(data: ManualOverrideFormValues) {
    setFormError(null)
    setPendingValues(data)
    setStep("confirm")
  }

  async function handleConfirmSubmit() {
    if (!pendingValues) return
    setFormError(null)
    try {
      const result = await submitMutation.mutateAsync(pendingValues)
      onSuccess(result.batch_id)
      handleClose(false)
    } catch (err) {
      setFormError(getApiErrorMessage(err, "ثبت نرخ ارز دستی ناموفق بود."))
      setStep("form")
    }
  }

  async function handleFetchCurrentRate() {
    setIsFetchingCurrent(true)
    setFormError(null)
    try {
      const current = await fetchCurrentExchangeRate()
      if (!current) {
        setCurrentRateHint(null)
        setFormError("هنوز هیچ نرخ ارزی در سیستم ثبت نشده.")
        return
      }
      setValue("rate", current.rate, { shouldValidate: true })
      setCurrentRateHint(
        `آخرین نرخ ثبت‌شده (وضعیت: ${RATE_STATUS_LABEL[current.status] ?? current.status}) در فیلد بالا قرار گرفت — در صورت نیاز اصلاحش کن.`,
      )
    } catch (err) {
      setFormError(getApiErrorMessage(err, "دریافت نرخ فعلی ناموفق بود."))
    } finally {
      setIsFetchingCurrent(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ثبت دستی نرخ ارز</DialogTitle>
          <DialogDescription>
            این نرخ فوراً اعمال نمی‌شه — یک batch پیشنهاد قیمت جدید می‌سازه که باید از پایین همین
            صفحه تایید کنی تا روی قیمت محصولات اثر بگذارد.
          </DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <form onSubmit={handleSubmit(goToConfirm)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="override-rate">نرخ ارز (تومان به ازای هر دلار)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleFetchCurrentRate}
                  disabled={isFetchingCurrent}
                >
                  {isFetchingCurrent ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  دریافت نرخ فعلی
                </Button>
              </div>
              {/* Bug fix: valueAsNumber made react-hook-form write NaN directly
                  into this DOM node (via ref) whenever the field had no value
                  yet, e.g. right after reset() on close - Chrome then logs
                  "The specified value "NaN" cannot be parsed". The input now
                  stays an uncontrolled string field; manualOverrideSchema
                  (z.coerce.number()) does the string -> number conversion.
                  NumericInput additionally blocks the common
                  accidental-mouse-wheel-scroll value change. */}
              <NumericInput id="override-rate" step="0.0001" min={0.0001} {...register("rate")} autoFocus />
              {errors.rate && <span className="text-xs text-danger">{errors.rate.message}</span>}
              {currentRateHint && <span className="text-xs text-text-3">{currentRateHint}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="override-reason">دلیل ثبت دستی (حداقل ۱۰ کاراکتر، برای audit)</Label>
                <span className={`text-xs ${reasonLength > REASON_MAX_LENGTH ? "text-danger" : "text-text-3"}`}>
                  {reasonLength}/{REASON_MAX_LENGTH}
                </span>
              </div>
              <Textarea id="override-reason" rows={3} maxLength={REASON_MAX_LENGTH} {...register("reason")} />
              {errors.reason && <span className="text-xs text-danger">{errors.reason.message}</span>}
            </div>

            {formError && (
              <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                انصراف
              </Button>
              <Button type="submit">ادامه</Button>
            </DialogFooter>
          </form>
        )}

        {step === "confirm" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-600">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                نرخ <strong>{pendingValues?.rate}</strong> تومان برای هر دلار ثبت می‌شه و برای همه‌ی محصولات دلاری یک
                پیشنهاد قیمت جدید ساخته می‌شه. این عملیات محدود به تعداد کمی در ساعت است. مطمئنی؟
              </span>
            </div>

            {formError && (
              <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("form")}
                disabled={submitMutation.isPending}
                autoFocus
              >
                برگشت
              </Button>
              <Button type="button" onClick={handleConfirmSubmit} disabled={submitMutation.isPending}>
                {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                ثبت نهایی نرخ
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
