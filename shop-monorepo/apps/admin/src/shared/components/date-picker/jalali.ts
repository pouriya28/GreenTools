import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js"

export const JALALI_MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
]

export const JALALI_WEEKDAY_NAMES = ["ش", "ی", "د", "س", "چ", "پ", "ج"] // شنبه تا جمعه

export interface JalaliDate {
  jy: number
  jm: number // ۱ تا ۱۲
  jd: number
}

export function gregorianToJalali(date: Date): JalaliDate {
  const { jy, jm, jd } = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate())
  return { jy, jm, jd }
}

/** ساعت/دقیقه رو هم می‌شه پاس داد؛ در غیر این‌صورت نیمه‌شبِ زمان محلی می‌مونه. */
export function jalaliToGregorian(jalali: JalaliDate, hours = 0, minutes = 0): Date {
  const { gy, gm, gd } = toGregorian(jalali.jy, jalali.jm, jalali.jd)
  return new Date(gy, gm - 1, gd, hours, minutes, 0, 0)
}

export function jalaliMonthLength(jy: number, jm: number): number {
  return jalaaliMonthLength(jy, jm)
}

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"]

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)])
}

export function formatJalaliDisplay(date: Date | null): string {
  if (!date) return ""
  const { jy, jm, jd } = gregorianToJalali(date)
  return `${toPersianDigits(jd)} ${JALALI_MONTH_NAMES[jm - 1]} ${toPersianDigits(jy)}`
}

export function formatJalaliDateTimeDisplay(date: Date | null): string {
  if (!date) return ""
  const hh = String(date.getHours()).padStart(2, "0")
  const mm = String(date.getMinutes()).padStart(2, "0")
  return `${formatJalaliDisplay(date)} - ${toPersianDigits(hh)}:${toPersianDigits(mm)}`
}

/**
 * پارس امن — هیچ‌وقت throw نمی‌کنه و هیچ‌وقت یه Invalid Date رو به بیرون
 * پاس نمی‌ده؛ این یه لایه‌ی دفاعی مستقل از اعتبارسنجی بک‌انده، نه جایگزینش.
 */
export function parseIsoSafely(value: string | null | undefined): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

/** خروجی: 'YYYY-MM-DD' — سازگار با ولیدیشن 'date' لاراول. */
export function toDateOnlyIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * خروجی: 'YYYY-MM-DDTHH:mm:ss' بدون Z — یعنی زمان محلی، نه UTC؛ دقیقاً همون
 * فرمتی که input[type=datetime-local] قبلاً تولید می‌کرد، پس جایگزین
 * درجا و بدون تغییر رفتار بک‌انده.
 */
export function toDateTimeIso(date: Date): string {
  return `${toDateOnlyIso(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
}