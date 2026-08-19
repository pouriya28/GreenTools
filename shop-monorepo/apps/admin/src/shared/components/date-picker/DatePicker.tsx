import { useMemo, useRef, useState } from "react"
import { CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { CalendarPanel } from "./CalendarPanel"
import { PopoverShell } from "./PopoverShell"
import { formatJalaliDisplay, gregorianToJalali, jalaliToGregorian, parseIsoSafely, toDateOnlyIso } from "./jalali"

interface DatePickerProps {
  /** مقدار به‌صورت 'YYYY-MM-DD' میلادی (یا هر رشته‌ی ISO قابل‌پارس) — یا null. */
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
}

export function DatePicker({ value, onChange, placeholder = "انتخاب تاریخ", disabled, id, className }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const selectedDate = useMemo(() => parseIsoSafely(value), [value])
  const today = useMemo(() => new Date(), [])

  const [viewYear, setViewYear] = useState(() => gregorianToJalali(selectedDate ?? today).jy)
  const [viewMonth, setViewMonth] = useState(() => gregorianToJalali(selectedDate ?? today).jm)

  function handleOpen() {
    if (disabled) return
    const j = gregorianToJalali(selectedDate ?? today)
    setViewYear(j.jy)
    setViewMonth(j.jm)
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

  function handleSelectDay(jd: number) {
    const gregorian = jalaliToGregorian({ jy: viewYear, jm: viewMonth, jd })
    onChange(toDateOnlyIso(gregorian))
    setOpen(false)
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
        <span className={cn(!selectedDate && "text-text-3")}>{selectedDate ? formatJalaliDisplay(selectedDate) : placeholder}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-text-2" />
      </button>

      <PopoverShell open={open} onClose={() => setOpen(false)} anchorRef={triggerRef}>
        <CalendarPanel
          viewYear={viewYear}
          viewMonth={viewMonth}
          selected={selectedDate}
          today={today}
          onNavigate={handleNavigate}
          onSelectDay={handleSelectDay}
        />
      </PopoverShell>
    </>
  )
}