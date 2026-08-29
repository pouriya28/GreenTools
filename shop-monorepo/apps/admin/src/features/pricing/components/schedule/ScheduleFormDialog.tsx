import { useEffect, useState } from "react"
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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { getApiErrorMessage } from "@/shared/lib/apiError"
import { exchangeRateScheduleSchema, type ExchangeRateScheduleFormValues } from "../../schema"
import { useCreateExchangeRateSchedule, useUpdateExchangeRateSchedule } from "../../hooks/useScheduleMutations"
import type { ExchangeRateSchedule, ExchangeRateScheduleFrequency } from "../../types"

const FREQUENCY_OPTIONS: Array<{ value: ExchangeRateScheduleFrequency; label: string }> = [
  { value: "daily", label: "روزانه" },
  { value: "weekly", label: "هفتگی" },
  { value: "monthly", label: "ماهانه" },
]

// PHP Carbon dayOfWeek convention used by the backend: 0=یکشنبه ... 6=شنبه.
const WEEKDAY_OPTIONS = [
  { value: 0, label: "یکشنبه" },
  { value: 1, label: "دوشنبه" },
  { value: 2, label: "سه‌شنبه" },
  { value: 3, label: "چهارشنبه" },
  { value: 4, label: "پنجشنبه" },
  { value: 5, label: "جمعه" },
  { value: 6, label: "شنبه" },
]

const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

interface ScheduleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // When set, the dialog edits this schedule instead of creating a new one.
  schedule?: ExchangeRateSchedule | null
  onSuccess: () => void
}

function toFormDefaults(schedule?: ExchangeRateSchedule | null): ExchangeRateScheduleFormValues {
  if (!schedule) {
    return { frequency: "daily", run_time: "09:00", days_of_week: [], days_of_month: [], is_active: true }
  }
  return {
    frequency: schedule.frequency,
    run_time: schedule.run_time,
    days_of_week: schedule.days_of_week ?? [],
    days_of_month: schedule.days_of_month ?? [],
    is_active: schedule.is_active,
  }
}

// یک دیالوگ کوچک و مستقل - هم برای ساخت و هم ویرایش زمان‌بندی دریافت خودکار
// نرخ استفاده می‌شه (طبق دستورالعمل پروژه: کامپوننت‌های کوچک و قابل استفاده‌ی
// دوباره). قوانین شرطی days_of_week/days_of_month دقیقاً منطبق با
// Store/UpdateExchangeRateScheduleRequest سمت بک‌اند در exchangeRateScheduleSchema
// پیاده‌سازی شده.
export function ScheduleFormDialog({ open, onOpenChange, schedule, onSuccess }: ScheduleFormDialogProps) {
  const isEditing = Boolean(schedule)
  const [formError, setFormError] = useState<string | null>(null)
  const createMutation = useCreateExchangeRateSchedule()
  const updateMutation = useUpdateExchangeRateSchedule()
  const isPending = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ExchangeRateScheduleFormValues>({
    resolver: zodResolver(exchangeRateScheduleSchema),
    defaultValues: toFormDefaults(schedule),
  })

  useEffect(() => {
    if (open) {
      reset(toFormDefaults(schedule))
      setFormError(null)
    }
  }, [open, schedule, reset])

  const frequency = watch("frequency")
  const selectedWeekdays = watch("days_of_week") ?? []
  const selectedMonthDays = watch("days_of_month") ?? []

  function toggleWeekday(day: number) {
    const next = selectedWeekdays.includes(day)
      ? selectedWeekdays.filter((d) => d !== day)
      : [...selectedWeekdays, day].sort((a, b) => a - b)
    setValue("days_of_week", next, { shouldValidate: true })
  }

  function toggleMonthDay(day: number) {
    const next = selectedMonthDays.includes(day)
      ? selectedMonthDays.filter((d) => d !== day)
      : [...selectedMonthDays, day].sort((a, b) => a - b)
    setValue("days_of_month", next, { shouldValidate: true })
  }

  async function onSubmit(values: ExchangeRateScheduleFormValues) {
    setFormError(null)
    const payload = {
      frequency: values.frequency,
      run_time: values.run_time,
      is_active: values.is_active,
      ...(values.frequency === "weekly" ? { days_of_week: values.days_of_week } : {}),
      ...(values.frequency === "monthly" ? { days_of_month: values.days_of_month } : {}),
    }
    try {
      if (isEditing && schedule) {
        await updateMutation.mutateAsync({ scheduleId: schedule.id, payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setFormError(getApiErrorMessage(err, "ذخیره‌ی زمان‌بندی ناموفق بود."))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "ویرایش زمان‌بندی" : "زمان‌بندی جدید"}</DialogTitle>
          <DialogDescription>
            در زمان تعیین‌شده، نرخ به‌صورت خودکار از API نوسان دریافت می‌شه (دقیقاً مثل زدن دکمه «دریافت آنی») و
            یک batch پیشنهاد قیمت جدید در انتظار بررسی می‌سازه — هیچ قیمتی بدون تایید دستی اعمال نمی‌شه.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>نوع زمان‌بندی</Label>
            <div className="flex gap-2">
              {FREQUENCY_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={frequency === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setValue("frequency", option.value, { shouldValidate: true })}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            {errors.frequency && <span className="text-xs text-danger">{errors.frequency.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="schedule-run-time">ساعت اجرا</Label>
            <Input id="schedule-run-time" type="time" className="w-32" {...register("run_time")} />
            {errors.run_time && <span className="text-xs text-danger">{errors.run_time.message}</span>}
          </div>

          {frequency === "weekly" && (
            <div className="flex flex-col gap-1.5">
              <Label>روزهای هفته</Label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAY_OPTIONS.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    size="sm"
                    variant={selectedWeekdays.includes(day.value) ? "default" : "outline"}
                    onClick={() => toggleWeekday(day.value)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
              {errors.days_of_week && <span className="text-xs text-danger">{errors.days_of_week.message}</span>}
            </div>
          )}

          {frequency === "monthly" && (
            <div className="flex flex-col gap-1.5">
              <Label>روزهای ماه</Label>
              <div className="grid grid-cols-7 gap-1.5">
                {MONTH_DAYS.map((day) => (
                  <Button
                    key={day}
                    type="button"
                    size="sm"
                    variant={selectedMonthDays.includes(day) ? "default" : "outline"}
                    className="h-8 w-8 p-0"
                    onClick={() => toggleMonthDay(day)}
                  >
                    {day}
                  </Button>
                ))}
              </div>
              {errors.days_of_month && <span className="text-xs text-danger">{errors.days_of_month.message}</span>}
            </div>
          )}

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label htmlFor="schedule-is-active">فعال باشد</Label>
            <Button
              id="schedule-is-active"
              type="button"
              size="sm"
              variant={watch("is_active") ? "default" : "outline"}
              onClick={() => setValue("is_active", !watch("is_active"))}
            >
              {watch("is_active") ? "فعال" : "غیرفعال"}
            </Button>
          </div>

          {formError && (
            <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              انصراف
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "ذخیره تغییرات" : "ساخت زمان‌بندی"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
