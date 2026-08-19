import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  JALALI_MONTH_NAMES,
  JALALI_WEEKDAY_NAMES,
  gregorianToJalali,
  jalaliMonthLength,
  jalaliToGregorian,
  toPersianDigits,
  type JalaliDate,
} from "./jalali"

interface CalendarPanelProps {
  viewYear: number
  viewMonth: number
  selected: Date | null
  today?: Date
  onNavigate: (direction: -1 | 1) => void
  onSelectDay: (jd: number) => void
}

// JS getDay(): یکشنبه=۰ ... شنبه=۶. تقویم شمسی از شنبه شروع می‌شه، پس
// برای این‌که ستون‌ها درست بشینن، شنبه باید ستون ۰ باشه.
function jsWeekdayToJalaliColumn(jsDay: number): number {
  return (jsDay + 1) % 7
}

export function CalendarPanel({ viewYear, viewMonth, selected, today, onNavigate, onSelectDay }: CalendarPanelProps) {
  const daysInMonth = jalaliMonthLength(viewYear, viewMonth)
  const firstOfMonthGregorian = jalaliToGregorian({ jy: viewYear, jm: viewMonth, jd: 1 })
  const startColumn = jsWeekdayToJalaliColumn(firstOfMonthGregorian.getDay())

  const selectedJalali: JalaliDate | null = selected ? gregorianToJalali(selected) : null
  const todayJalali: JalaliDate | null = today ? gregorianToJalali(today) : null

  const cells: (number | null)[] = [
    ...Array.from({ length: startColumn }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="w-72 rounded-2xl border border-border bg-bg-1 p-4 shadow-xl" dir="rtl">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-2 hover:bg-bg-3 hover:text-text-1"
          aria-label="ماه قبل"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-text-1">
          {JALALI_MONTH_NAMES[viewMonth - 1]} {toPersianDigits(viewYear)}
        </span>
        <button
          type="button"
          onClick={() => onNavigate(1)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-2 hover:bg-bg-3 hover:text-text-1"
          aria-label="ماه بعد"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-xs text-text-3">
        {JALALI_WEEKDAY_NAMES.map((label) => (
          <span key={label} className="py-1">
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((jd, index) => {
          if (jd === null) return <span key={`empty-${index}`} />

          const isSelected =
            selectedJalali?.jy === viewYear && selectedJalali?.jm === viewMonth && selectedJalali?.jd === jd
          const isToday = todayJalali?.jy === viewYear && todayJalali?.jm === viewMonth && todayJalali?.jd === jd

          return (
            <button
              key={jd}
              type="button"
              onClick={() => onSelectDay(jd)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors",
                "text-text-1 hover:bg-bg-3",
                isSelected && "bg-primary text-white hover:bg-primary",
                !isSelected && isToday && "border border-primary/50 text-primary"
              )}
            >
              {toPersianDigits(jd)}
            </button>
          )
        })}
      </div>
    </div>
  )
}