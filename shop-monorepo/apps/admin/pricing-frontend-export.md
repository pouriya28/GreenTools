# Pricing Frontend Export
Generated at: 2026-08-24 05:46:08

## src\features\pricing\schema.ts

```ts
import { z } from "zod"

// Mirrors the backend's ManualExchangeRateOverrideRequest rules (rate: required
// number within the min/max sane-rate range read from server config; reason:
// required, 10-500 chars). Since the exact sane-rate range lives in server
// config and isn't exposed to the frontend, we only validate a positive number
// here; the precise out-of-range message is shown from the server's 422 response.
export const manualOverrideSchema = z.object({
  // Bug fix: this field is coerced from the <Input type="number"> element's
  // raw string value (register() no longer uses valueAsNumber - see
  // ManualOverrideDialog.tsx for why). z.coerce.number() turns an empty
  // string into Number.NaN, which zod already reports via invalid_type_error
  // below, so an empty field still shows a clear Persian message.
  rate: z.coerce
    .number({ invalid_type_error: "نرخ ارز را به‌صورت یک عدد معتبر وارد کنید" })
    .positive("نرخ ارز باید عددی مثبت باشد"),
  reason: z
    .string({ required_error: "دلیل ثبت نرخ الزامی است" })
    .min(10, "دلیل باید حداقل ۱۰ کاراکتر باشد تا برای audit قابل استفاده باشد")
    .max(500, "دلیل نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد"),
})

export type ManualOverrideFormValues = z.infer<typeof manualOverrideSchema>

// Mirrors the backend's UpdatePriceProposalRequest rules
export const editProposalPriceSchema = z.object({
  edited_price_toman: z
    .number({ required_error: "قیمت جدید را وارد کنید", invalid_type_error: "قیمت باید عدد باشد" })
    .int("قیمت باید عدد صحیح (تومان) باشد")
    .min(1, "قیمت باید حداقل ۱ تومان باشد")
    .max(99999999999, "قیمت وارد شده خارج از بازه‌ی مجاز است"),
})

export type EditProposalPriceFormValues = z.infer<typeof editProposalPriceSchema>

```

## src\features\pricing\types.ts

```ts
export type PriceProposalStatus = "pending_review" | "approved" | "rejected" | "edited"

export interface PriceProposalProductSummary {
  id: number
  name: string
  sku: string
}

// Exact shape of ProductPriceProposalResource (backend)
export interface PriceProposal {
  id: number
  batch_id: string
  product: PriceProposalProductSummary
  old_price_toman: number
  new_price_toman: number
  edited_price_toman: number | null
  effective_price_toman: number
  status: PriceProposalStatus
  reviewed_by: number | null
  reviewed_at: string | null
  created_at: string | null
}

export interface PriceProposalFilters {
  batch_id?: string
  page?: number
  per_page?: number
}

// Exactly matches ManualExchangeRateOverrideRequest
export interface ManualOverridePayload {
  rate: number
  reason: string
}

// Exact response shape of ExchangeRateOverrideController::store (201)
export interface ManualOverrideResult {
  message: string
  exchange_rate_id: number
  batch_id: string
}

// Exact response shape of ExchangeRateOverrideController::current (200)
export interface CurrentExchangeRate {
  rate: number
  status: string
  source: string
  fetched_at: string | null
}

export interface BatchReviewResult {
  message: string
}

export interface ResourceEnvelope<T> {
  data: T
}

```

## src\features\pricing\api\pricingApi.ts

```ts
import { api } from "@/shared/lib/axios"
import type { PaginatedResponse } from "@/shared/types/pagination.types"
import type {
  BatchReviewResult,
  CurrentExchangeRate,
  ManualOverridePayload,
  ManualOverrideResult,
  PriceProposal,
  PriceProposalFilters,
  ResourceEnvelope,
} from "../types"

// Security note: these routes are protected on the backend by the
// auth:sanctum, staff.access, account.active, throttle:120,1 middleware; the
// manual override additionally has its own, stricter throttle (5 per 60
// minutes). Here we only surface a readable throttle/access error message —
// the real limit is always enforced server-side, never here.
const BASE = "/admin/prices"

export async function fetchPriceProposals(filters: PriceProposalFilters = {}) {
  const { data } = await api.get<PaginatedResponse<PriceProposal>>(`${BASE}/proposals`, {
    params: {
      batch_id: filters.batch_id || undefined,
      page: filters.page || 1,
      per_page: filters.per_page || 50,
    },
  })
  return data
}

export async function fetchCurrentExchangeRate() {
  const { data } = await api.get<ResourceEnvelope<CurrentExchangeRate | null>>(`${BASE}/current`)
  return data.data
}

export async function updatePriceProposal(proposalId: number, editedPriceToman: number) {
  const { data } = await api.patch<ResourceEnvelope<PriceProposal>>(`${BASE}/proposals/${proposalId}`, {
    edited_price_toman: editedPriceToman,
  })
  return data.data
}

export async function approvePriceProposal(proposalId: number) {
  const { data } = await api.post<ResourceEnvelope<PriceProposal>>(`${BASE}/proposals/${proposalId}/approve`)
  return data.data
}

export async function rejectPriceProposal(proposalId: number) {
  const { data } = await api.post<ResourceEnvelope<PriceProposal>>(`${BASE}/proposals/${proposalId}/reject`)
  return data.data
}

export async function approveProposalBatch(batchId: string) {
  const { data } = await api.post<BatchReviewResult>(`${BASE}/proposals/batch/${batchId}/approve`)
  return data
}

export async function rejectProposalBatch(batchId: string) {
  const { data } = await api.post<BatchReviewResult>(`${BASE}/proposals/batch/${batchId}/reject`)
  return data
}

export async function submitManualExchangeRateOverride(payload: ManualOverridePayload) {
  const { data } = await api.post<ManualOverrideResult>(`${BASE}/override`, payload)
  return data
}

// This route returns raw CSV (Content-Type: text/csv), not a JSON envelope;
// responseType must be "blob" or axios will try to JSON.parse the body and
// fail on real CSV content.
export async function exportPriceProposalsCsv(batchId: string) {
  const response = await api.get(`${BASE}/proposals/${batchId}/export`, {
    responseType: "blob",
  })
  return response.data as Blob
}

export function downloadCsvBlob(blob: Blob, batchId: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `price-proposals-${batchId}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

```

## src\features\pricing\components\BatchSummaryBar.tsx

```tsx
import { useState } from "react"
import { AlertTriangle, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getApiErrorMessage } from "@/shared/lib/apiError"
import { downloadCsvBlob, exportPriceProposalsCsv } from "../api/pricingApi"
import { useApproveProposalBatch, useRejectProposalBatch } from "../hooks/usePricingMutations"
import type { PriceProposal } from "../types"

interface BatchSummaryBarProps {
  batchId: string
  batchIdInput: string
  onBatchIdInputChange: (value: string) => void
  onBatchIdSubmit: () => void
  proposals: PriceProposal[]
}

// نوار خلاصه‌ی batch: انتخاب batch، خروجی CSV، و تایید/رد دسته‌جمعی — این
// عملیات‌ها حساس و غیرقابل‌بازگشتن، پس هر دو پشت یک دیالوگ تایید صریح قرار
// گرفتن (جلوگیری از خطای انسانی طبق اولویت امنیتی پروژه).
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

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-1 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-text-2">شناسه Batch:</span>
        <Input
          value={batchIdInput}
          onChange={(e) => onBatchIdInputChange(e.target.value)}
          placeholder="خالی = آخرین batch"
          className="h-8 w-72 font-mono text-xs"
        />
        <Button type="button" variant="outline" size="sm" onClick={onBatchIdSubmit}>
          نمایش
        </Button>

        <div className="mr-auto flex items-center gap-2">
          <span className="text-xs text-text-2">{pendingCount} پیشنهاد در انتظار بررسی</span>
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

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction === "approve" ? "تایید کل batch" : "رد کل batch"}</AlertDialogTitle>
            <AlertDialogDescription>
              این عملیات روی {pendingCount} پیشنهاد قیمت در انتظار بررسی اعمال می‌شه و قابل بازگشت نیست. مطمئنی؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBatchAction} disabled={isBusy}>
              {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
              تایید نهایی
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

```

## src\features\pricing\components\EditProposedPriceCell.tsx

```tsx
import { useState } from "react"
import { Check, Loader2, Pencil, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getApiErrorMessage } from "@/shared/lib/apiError"
import { formatPrice } from "@/features/products/utils"
import { editProposalPriceSchema } from "../schema"
import { useUpdatePriceProposal } from "../hooks/usePricingMutations"
import type { PriceProposal } from "../types"

interface EditProposedPriceCellProps {
  proposal: PriceProposal
  disabled?: boolean
}

// تکه‌ی کوچک و مستقل قابل استفاده‌ی دوباره: فقط مسئول ویرایش inline قیمت
// پیشنهادی یک ردیف است — طبق دستورالعمل استاندارد، کامپوننت‌ها کوچک و
// تک‌مسئولیتی نگه داشته شدند.
export function EditProposedPriceCell({ proposal, disabled }: EditProposedPriceCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(String(proposal.effective_price_toman))
  const [error, setError] = useState<string | null>(null)
  const updateMutation = useUpdatePriceProposal()

  function startEdit() {
    setValue(String(proposal.effective_price_toman))
    setError(null)
    setIsEditing(true)
  }

  async function handleSave() {
    const parsed = editProposalPriceSchema.safeParse({ edited_price_toman: Number(value) })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "قیمت نامعتبر است")
      return
    }
    setError(null)
    try {
      await updateMutation.mutateAsync({
        proposalId: proposal.id,
        editedPriceToman: parsed.data.edited_price_toman,
      })
      setIsEditing(false)
    } catch (err) {
      // طبق guardNotFinal سمت بک‌اند، اگه پیشنهاد در همین حین توسط یک ادمین
      // دیگه approve/reject شده باشه، اینجا 409 برمی‌گرده — پیام دقیق سرور رو
      // نشون می‌دیم تا کاربر گیج نشه.
      setError(getApiErrorMessage(err, "ذخیره‌ی قیمت اصلاح‌شده ناموفق بود."))
    }
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <span className="font-medium text-text-1">{formatPrice(proposal.effective_price_toman)} تومان</span>
          {proposal.edited_price_toman !== null && (
            <span className="text-xs text-text-3 line-through">{formatPrice(proposal.new_price_toman)}</span>
          )}
        </div>
        {!disabled && (
          <Button type="button" variant="ghost" size="icon" aria-label="اصلاح قیمت پیشنهادی" onClick={startEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <Input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-8 w-32"
          autoFocus
        />
        <Button type="button" variant="ghost" size="icon" onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsEditing(false)}
          disabled={updateMutation.isPending}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}

```

## src\features\pricing\components\ExchangeRateBlockedNotice.tsx

```tsx
import { AlertTriangle, Info } from "lucide-react"

// هشدار مهم: در کدهای واقعی که برام ارسال شده (RefreshExchangeRateJob،
// PriceProposalService، ExchangeRate model)، هیچ مسیری پیدا نشد که status یک
// ExchangeRate رو به 'applied' تبدیل کند (نه بعد از approveBatch، نه جای
// دیگری). اگر منطق ساخت محصول جدید دقیقاً به همین status=applied تکیه کند، این
// توضیح رو توی صفحه نشون می‌دهیم تا کاربر ادمین مطمئن نشه که درست شده و بدون
// گم کردن فرانت رو مطلع کنیم تا فایل واقعی مسدودکننده رو بگیریم.
export function ExchangeRateBlockedNotice() {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700">
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          نرخ ارزی که از همین‌جا با دکمه‌ی «ثبت نرخ ارز جدید» درج کنی، فوراً «نرخ فعلی»
          سیستم نمی‌شه — فقط یک batch پیشنهاد قیمت pending_review می‌سازد که باید از جدول
          پایین تاییدش کنی.
        </p>
      </div>
      <div className="flex items-start gap-2 border-t border-amber-500/20 pt-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          نکته‌ی مهم برای بررسی بک‌اند: در کدهایی که برام ارسال شده، هیچ جایی وضعیت
          ExchangeRate رو به{" "}
          <code className="rounded bg-black/10 px-1">applied</code> تبدیل نمی‌کند (نه بعد از تایید
          batch، نه جای دیگر). اگر منطق ساخت محصول جدید دقیقاً به همین وضعیت applied تکیه
          کند، حتی بعد از ثبت و تایید این نرخ ممکنه پیام «نرخ ارز ثبت نشده» دوباره تکرار
          شود. لطفاً فایل واقعی سرویس/کنترلری که این پیام رو حین ساخت محصول جدید می‌ده رو
          برام بفرست تا این حلقه رو کامل ببندیم.
        </p>
      </div>
    </div>
  )
}

```

## src\features\pricing\components\ManualOverrideDialog.tsx

```tsx
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage } from "@/shared/lib/apiError"
import { fetchCurrentExchangeRate } from "../api/pricingApi"
import { manualOverrideSchema, type ManualOverrideFormValues } from "../schema"
import { useSubmitManualOverride } from "../hooks/usePricingMutations"

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
// guard against human error (e.g. an accidental click).
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
                  (z.coerce.number()) does the string -> number conversion. */}
              <Input id="override-rate" type="number" step="0.0001" {...register("rate")} autoFocus />
              {errors.rate && <span className="text-xs text-danger">{errors.rate.message}</span>}
              {currentRateHint && <span className="text-xs text-text-3">{currentRateHint}</span>}
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

```

## src\features\pricing\components\PriceProposalRowActions.tsx

```tsx
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

```

## src\features\pricing\components\PriceProposalStatusBadge.tsx

```tsx
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

```

## src\features\pricing\components\PriceProposalTable.tsx

```tsx
import { useState } from "react"
import { AlertTriangle, PackageOpen } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPrice } from "@/features/products/utils"
import type { PriceProposal } from "../types"
import { PriceProposalStatusBadge } from "./PriceProposalStatusBadge"
import { EditProposedPriceCell } from "./EditProposedPriceCell"
import { PriceProposalRowActions } from "./PriceProposalRowActions"

interface PriceProposalTableProps {
  proposals: PriceProposal[]
}

const FINAL_STATUSES = new Set(["approved", "rejected"])

export function PriceProposalTable({ proposals }: PriceProposalTableProps) {
  const [rowError, setRowError] = useState<string | null>(null)

  if (proposals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-text-2">
        <PackageOpen className="h-8 w-8 opacity-50" />
        <p className="text-sm">پیشنهاد قیمتی در این batch وجود ندارد.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {rowError && (
        <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{rowError}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>محصول</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>قیمت قبلی</TableHead>
              <TableHead>قیمت پیشنهادی</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead className="w-48 text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proposals.map((proposal) => (
              <TableRow key={proposal.id}>
                <TableCell className="font-medium text-text-1">{proposal.product.name}</TableCell>
                <TableCell className="whitespace-nowrap text-xs text-text-2">{proposal.product.sku}</TableCell>
                <TableCell className="text-text-2">{formatPrice(proposal.old_price_toman)} تومان</TableCell>
                <TableCell>
                  <EditProposedPriceCell proposal={proposal} disabled={FINAL_STATUSES.has(proposal.status)} />
                </TableCell>
                <TableCell>
                  <PriceProposalStatusBadge status={proposal.status} />
                </TableCell>
                <TableCell>
                  <PriceProposalRowActions proposal={proposal} onError={setRowError} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

```

## src\features\pricing\hooks\usePriceProposals.ts

```ts
import { useQuery } from "@tanstack/react-query"
import { fetchPriceProposals } from "../api/pricingApi"
import type { PriceProposalFilters } from "../types"

export function usePriceProposals(filters: PriceProposalFilters) {
  return useQuery({
    queryKey: ["pricing", "proposals", filters.batch_id ?? "latest", filters.page ?? 1, filters.per_page ?? 50],
    queryFn: () => fetchPriceProposals(filters),
    // این لیست بین چند ادمین به‌اشتراک گذاشته می‌شه (ممکنه یکی دیگه همین الان
    // تایید/رد/اصلاح کرده باشه)، پس staleTime رو کوتاه نگه می‌داریم.
    staleTime: 15_000,
  })
}

```

## src\features\pricing\hooks\usePricingMutations.ts

```ts
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import {
  approvePriceProposal,
  approveProposalBatch,
  rejectPriceProposal,
  rejectProposalBatch,
  submitManualExchangeRateOverride,
  updatePriceProposal,
} from "../api/pricingApi"
import type { ManualOverridePayload } from "../types"

function invalidateProposals(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["pricing", "proposals"] })
}

export function useUpdatePriceProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ proposalId, editedPriceToman }: { proposalId: number; editedPriceToman: number }) =>
      updatePriceProposal(proposalId, editedPriceToman),
    onSuccess: () => invalidateProposals(queryClient),
  })
}

export function useApprovePriceProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (proposalId: number) => approvePriceProposal(proposalId),
    onSuccess: () => invalidateProposals(queryClient),
  })
}

export function useRejectPriceProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (proposalId: number) => rejectPriceProposal(proposalId),
    onSuccess: () => invalidateProposals(queryClient),
  })
}

export function useApproveProposalBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (batchId: string) => approveProposalBatch(batchId),
    onSuccess: () => invalidateProposals(queryClient),
  })
}

export function useRejectProposalBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (batchId: string) => rejectProposalBatch(batchId),
    onSuccess: () => invalidateProposals(queryClient),
  })
}

export function useSubmitManualOverride() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ManualOverridePayload) => submitManualExchangeRateOverride(payload),
    onSuccess: () => invalidateProposals(queryClient),
  })
}

```

## src\features\pricing\pages\PricingPage.tsx

```tsx
import { useState } from "react"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getApiErrorMessage } from "@/shared/lib/apiError"
import { usePriceProposals } from "../hooks/usePriceProposals"
import { PriceProposalTable } from "../components/PriceProposalTable"
import { BatchSummaryBar } from "../components/BatchSummaryBar"
import { ManualOverrideDialog } from "../components/ManualOverrideDialog"

export default function PricingPage() {
  const [batchId, setBatchId] = useState("")
  const [batchIdInput, setBatchIdInput] = useState("")
  const [isOverrideOpen, setIsOverrideOpen] = useState(false)

  // Empty batch_id = the backend (PriceProposalController::index) returns the latest batch on its own.
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
          {getApiErrorMessage(error, "دریافت پیشنهادهای قیمت ناموفق بود.")}
        </div>
      ) : (
        <PriceProposalTable proposals={proposals} />
      )}

      <ManualOverrideDialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen} onSuccess={handleOverrideSuccess} />
    </div>
  )
}

```

