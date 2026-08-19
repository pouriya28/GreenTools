import { useMemo, useRef, useState } from "react"
import { CalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"
import { CalendarPanel } from "./CalendarPanel"
import { PopoverShell } from "./PopoverShell"
import {
  formatJalaliDateTimeDisplay,
  gregorianToJalali,
  jalaliToGregorian,
  parseIsoSafely,
  toDateTimeIso,
  toPersianDigits,
} from "./jalali"

interface DateTimePickerProps {
  /** مقدار به‌صورت 'YYYY-MM-DDTHH:mm:ss' میلادی (یا هر رشته‌ی ISO قابل‌پارس) — یا null. */
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
}

function clampToRange(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ و ساعت",
  disabled,
  id,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const selectedDate = useMemo(() => parseIsoSafely(value), [value])
  const today = useMemo(() => new Date(), [])

  const [viewYear, setViewYear] = useState(() => gregorianToJalali(selectedDate ?? today).jy)
  const [viewMonth, setViewMonth] = useState(() => gregorianToJalali(selectedDate ?? today).jm)
  const [hours, setHours] = useState(selectedDate?.getHours() ?? 0)
  const [minutes, setMinutes] = useState(selectedDate?.getMinutes() ?? 0)
  // روزی که کاربر انتخاب کرده ولی هنوز به‌صورت کامل commit نشده (تا ساعت هم مشخص بشه)
  const [pendingDay, setPendingDay] = useState<number | null>(selectedDate ? gregorianToJalali(selectedDate).jd : null)

  function handleOpen() {
    if (disabled) return
    const j = gregorianToJalali(selectedDate ?? today)
    setViewYear(j.jy)
    setViewMonth(j.jm)
    setPendingDay(selectedDate ? j.jd : null)
    setHours(selectedDate?.getHours() ?? 0)
    setMinutes(selectedDate?.getMinutes() ?? 0)
    setOpen(true)
  }

  function handleNavigate(direction: -1 | 1) {
    let nextMonth = viewMonth + direction
    let nextYear = viewYear
    if (nextMonth > 12) {
      nextMonth = 1
      nextYear += 1
    } else if (nextMonth < 1) {
      nextMonth = 12
      nextYear -= 1
    }
    setViewMonth(nextMonth)
    setViewYear(nextYear)
  }

  function commit(day: number, h: number, m: number) {
    const gregorian = jalaliToGregorian({ jy: viewYear, jm: viewMonth, jd: day }, h, m)
    onChange(toDateTimeIso(gregorian))
  }

  function handleSelectDay(jd: number) {
    setPendingDay(jd)
    commit(jd, hours, minutes)
  }

  function handleHoursChange(raw: string) {
    const parsed = clampToRange(Number(raw) || 0, 0, 23)
    setHours(parsed)
    if (pendingDay !== null) commit(pendingDay, parsed, minutes)
  }

  function handleMinutesChange(raw: string) {
    const parsed = clampToRange(Number(raw) || 0, 0, 59)
    setMinutes(parsed)
    if (pendingDay !== null) commit(pendingDay, hours, parsed)
  }

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : handleOpen())}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-bg-0 px-3 text-sm text-text-1",
          "hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <span className={cn(!selectedDate && "text-text-3")}>
          {selectedDate ? formatJalaliDateTimeDisplay(selectedDate) : placeholder}
        </span>
        <CalendarClock className="h-4 w-4 shrink-0 text-text-2" />
      </button>

      <PopoverShell open={open} onClose={() => setOpen(false)} anchorRef={triggerRef}>
        <div className="flex flex-col gap-3">
          <CalendarPanel
            viewYear={viewYear}
            viewMonth={viewMonth}
            selected={selectedDate}
            today={today}
            onNavigate={handleNavigate}
            onSelectDay={handleSelectDay}
          />
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-bg-1 p-3 shadow-xl" dir="rtl">
            <span className="text-xs text-text-2">ساعت:</span>
            <input
              type="number"
              min={0}
              max={23}
              value={hours}
              onChange={(e) => handleHoursChange(e.target.value)}
              className="h-8 w-14 rounded-md border border-border bg-bg-0 text-center text-sm text-text-1"
            />
            <span className="text-text-2">:</span>
            <input
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) => handleMinutesChange(e.target.value)}
              className="h-8 w-14 rounded-md border border-border bg-bg-0 text-center text-sm text-text-1"
            />
            <span className="text-xs text-text-3">
              ({toPersianDigits(hours)}:{toPersianDigits(minutes)})
            </span>
          </div>
        </div>
      </PopoverShell>
    </>
  )
}