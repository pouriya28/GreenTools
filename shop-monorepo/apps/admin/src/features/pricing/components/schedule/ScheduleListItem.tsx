import { Loader2, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ExchangeRateSchedule } from "../../types"

const WEEKDAY_LABELS: Record<number, string> = {
  0: "یکشنبه",
  1: "دوشنبه",
  2: "سه‌شنبه",
  3: "چهارشنبه",
  4: "پنجشنبه",
  5: "جمعه",
  6: "شنبه",
}

const FREQUENCY_LABELS: Record<ExchangeRateSchedule["frequency"], string> = {
  daily: "روزانه",
  weekly: "هفتگی",
  monthly: "ماهانه",
}

function describeSchedule(schedule: ExchangeRateSchedule): string {
  if (schedule.frequency === "weekly" && schedule.days_of_week?.length) {
    return schedule.days_of_week.map((d) => WEEKDAY_LABELS[d] ?? d).join("، ")
  }
  if (schedule.frequency === "monthly" && schedule.days_of_month?.length) {
    return `روزهای ${schedule.days_of_month.join("، ")} هر ماه`
  }
  return "هر روز"
}

interface ScheduleListItemProps {
  schedule: ExchangeRateSchedule
  isDeleting: boolean
  onEdit: () => void
  onDelete: () => void
}

// یک ردیف مستقل و کوچک برای هر زمان‌بندی — فقط مسئول نمایش و دو اکشن (ویرایش/حذف)،
// طبق دستورالعمل پروژه برای کامپوننت‌های کوچک و تک‌مسئولیتی.
export function ScheduleListItem({ schedule, isDeleting, onEdit, onDelete }: ScheduleListItemProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={schedule.is_active ? "default" : "outline"}>{schedule.is_active ? "فعال" : "غیرفعال"}</Badge>
        <span className="text-sm font-medium text-text-1">{FREQUENCY_LABELS[schedule.frequency]}</span>
        <span className="text-sm text-text-2">ساعت {schedule.run_time}</span>
        <span className="text-xs text-text-3">{describeSchedule(schedule)}</span>
        {schedule.last_triggered_at && (
          <span className="text-xs text-text-3">
            آخرین اجرا: {new Date(schedule.last_triggered_at).toLocaleString("fa-IR")}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="icon" aria-label="ویرایش زمان‌بندی" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="حذف زمان‌بندی"
          className="text-danger hover:bg-danger/10 hover:text-danger"
          onClick={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  )
}
