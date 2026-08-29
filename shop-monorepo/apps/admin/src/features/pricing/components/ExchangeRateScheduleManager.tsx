import { useState } from "react"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getApiErrorMessage } from "@/shared/lib/apiError"
import { useDeleteExchangeRateSchedule, useExchangeRateSchedules } from "../hooks/useScheduleMutations"
import { ConfirmActionDialog } from "./shared/ConfirmActionDialog"
import { InlineErrorBanner } from "./shared/InlineErrorBanner"
import { ScheduleFormDialog } from "./schedule/ScheduleFormDialog"
import { ScheduleListItem } from "./schedule/ScheduleListItem"
import type { ExchangeRateSchedule } from "../types"

// مدیریت زمان‌بندی‌های دریافت خودکار نرخ ارز (admin/exchange-rates/schedules)،
// کاملاً مستقل از بررسی پیشنهادهای قیمت — فقط exchange-rates.manage لازم است، نه
// prices.review. هر زمان‌بندی فقط یک دریافت خودکار (معادل دکمه‌ی "دریافت آنی") را
// زمان‌بندی می‌کند — همان مسیر تأیید/بازبینی پیشنهادها را طی می‌کند، هیچ
// قیمتی را بدون تایید دستی اعمال نمی‌کند.
export function ExchangeRateScheduleManager() {
  const { data: schedules, isLoading, isError, error } = useExchangeRateSchedules()
  const deleteMutation = useDeleteExchangeRateSchedule()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ExchangeRateSchedule | null>(null)
  const [deletingSchedule, setDeletingSchedule] = useState<ExchangeRateSchedule | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  function openCreateForm() {
    setEditingSchedule(null)
    setIsFormOpen(true)
  }

  function openEditForm(schedule: ExchangeRateSchedule) {
    setEditingSchedule(schedule)
    setIsFormOpen(true)
  }

  async function handleDelete() {
    if (!deletingSchedule) return
    setActionError(null)
    try {
      await deleteMutation.mutateAsync(deletingSchedule.id)
      setDeletingSchedule(null)
    } catch (err) {
      setActionError(getApiErrorMessage(err, "حذف زمان‌بندی ناموفق بود."))
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-1 p-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text-1">زمان‌بندی دریافت خودکار نرخ ارز</h2>
          <p className="text-xs text-text-3">هر بار طبق زمان‌بندی، یک نرخ جدید در انتظار بررسی ساخته می‌شود و هیچ قیمتی خودکار اعمال نمی‌شود.</p>
        </div>
        <Button type="button" size="sm" onClick={openCreateForm}>
          <Plus className="h-3.5 w-3.5" />
          زمان‌بندی جدید
        </Button>
      </div>

      {actionError && <InlineErrorBanner message={actionError} />}

      {isLoading ? (
        <span className="flex items-center gap-2 text-sm text-text-3">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> در حال بارگذاری...
        </span>
      ) : isError ? (
        <InlineErrorBanner message={getApiErrorMessage(error, "دریافت زمان‌بندی‌ها ناموفق بود.")} />
      ) : schedules && schedules.length > 0 ? (
        <div className="flex flex-col gap-2">
          {schedules.map((schedule) => (
            <ScheduleListItem
              key={schedule.id}
              schedule={schedule}
              isDeleting={deleteMutation.isPending && deletingSchedule?.id === schedule.id}
              onEdit={() => openEditForm(schedule)}
              onDelete={() => setDeletingSchedule(schedule)}
            />
          ))}
        </div>
      ) : (
        <span className="text-sm text-text-3">هنوز هیچ زمان‌بندیی ثبت نشده.</span>
      )}

      <ScheduleFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        schedule={editingSchedule}
        onSuccess={() => setEditingSchedule(null)}
      />

      <ConfirmActionDialog
        open={deletingSchedule !== null}
        onOpenChange={(open) => !open && setDeletingSchedule(null)}
        title="حذف زمان‌بندی"
        description="این زمان‌بندی دیگر اجرا نمی‌شود و قابل بازگشت نیست. مطمئنی؟"
        destructive
        isBusy={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}
