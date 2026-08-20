import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage } from "@/shared/lib/apiError"
import { manualOverrideSchema, type ManualOverrideFormValues } from "../schema"
import { useSubmitManualOverride } from "../hooks/usePricingMutations"

interface ManualOverrideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (batchId: string) => void
}

// عملیاتی حساس و کم‌تعداد (throttle 5 در 60 دقیقه سمت سرور) که نرخ ارز رو
// مستقیم دستی ثبت می‌کند — به همین خاطر یک مرحله‌ی تأیید صریح (نمایش خلاصه
// قبل از ارسال واقعی) اضافه شده تا از خطای انسانی (مثلاً فشردن اشتباهی دکمه) جلوگیری
// شود.
export function ManualOverrideDialog({ open, onOpenChange, onSuccess }: ManualOverrideDialogProps) {
  const [step, setStep] = useState<"form" | "confirm">("form")
  const [formError, setFormError] = useState<string | null>(null)
  const submitMutation = useSubmitManualOverride()

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<ManualOverrideFormValues>({
    resolver: zodResolver(manualOverrideSchema),
  })

  function handleClose(next: boolean) {
    if (submitMutation.isPending) return
    if (!next) {
      reset()
      setStep("form")
      setFormError(null)
    }
    onOpenChange(next)
  }

  function goToConfirm() {
    setFormError(null)
    setStep("confirm")
  }

  async function handleConfirmSubmit() {
    setFormError(null)
    const values = getValues()
    try {
      const result = await submitMutation.mutateAsync(values)
      onSuccess(result.batch_id)
      handleClose(false)
    } catch (err) {
      setFormError(getApiErrorMessage(err, "ثبت نرخ ارز دستی ناموفق بود."))
      setStep("form")
    }
  }

  const values = getValues()

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
              <Label htmlFor="override-rate">نرخ ارز (تومان به ازای هر دلار)</Label>
              <Input
                id="override-rate"
                type="number"
                step="0.0001"
                {...register("rate", { valueAsNumber: true })}
                autoFocus
              />
              {errors.rate && <span className="text-xs text-danger">{errors.rate.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="override-reason">دلیل ثبت دستی (حداقل ۱۰ کاراکتر، برای audit)</Label>
              <Textarea id="override-reason" rows={3} {...register("reason")} />
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
                نرخ <strong>{values.rate}</strong> تومان برای هر دلار ثبت می‌شه و برای همه‌ی محصولات دلاری یک
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
