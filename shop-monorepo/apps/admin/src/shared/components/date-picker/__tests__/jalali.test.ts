import { describe, it, expect } from "vitest"
import {
gregorianToJalali,
jalaliToGregorian,
jalaliMonthLength,
toPersianDigits,
formatJalaliDisplay,
formatJalaliDateTimeDisplay,
parseIsoSafely,
toDateOnlyIso,
toDateTimeIso,
JALALI_MONTH_NAMES,
} from "@/shared/components/date-picker/jalali"

describe("jalali utilities", () => {
describe("gregorianToJalali", () => {
it("converts a known Gregorian date to Jalali", () => {
// 2024-01-01 = 1402/10/11
const result = gregorianToJalali(new Date(2024, 0, 1))
expect(result.jy).toBe(1402)
expect(result.jm).toBe(10)
expect(result.jd).toBe(11)
})

    it("converts Nowruz correctly", () => {
        // 2024-03-20 = 1403/01/01 (Nowruz)
        const result = gregorianToJalali(new Date(2024, 2, 20))
        expect(result.jy).toBe(1403)
        expect(result.jm).toBe(1)
        expect(result.jd).toBe(1)
    })

    it("converts last day of year correctly", () => {
        // 2024-03-19 = 1402/12/29
        const result = gregorianToJalali(new Date(2024, 2, 19))
        expect(result.jy).toBe(1402)
        expect(result.jm).toBe(12)
    })

    it("returns object with jy, jm, jd keys", () => {
        const result = gregorianToJalali(new Date(2024, 5, 1))
        expect(result).toHaveProperty("jy")
        expect(result).toHaveProperty("jm")
        expect(result).toHaveProperty("jd")
    })
})

describe("jalaliToGregorian", () => {
    it("converts Jalali to Gregorian correctly", () => {
        const result = jalaliToGregorian({ jy: 1402, jm: 10, jd: 11 })
        expect(result.getFullYear()).toBe(2024)
        expect(result.getMonth()).toBe(0) // January
        expect(result.getDate()).toBe(1)
    })

    it("converts Nowruz to correct Gregorian date", () => {
        const result = jalaliToGregorian({ jy: 1403, jm: 1, jd: 1 })
        expect(result.getFullYear()).toBe(2024)
        expect(result.getMonth()).toBe(2) // March
        expect(result.getDate()).toBe(20)
    })

    it("round-trips with gregorianToJalali", () => {
        const original = new Date(2024, 5, 15)
        const jalali = gregorianToJalali(original)
        const back = jalaliToGregorian(jalali)
        expect(back.getFullYear()).toBe(original.getFullYear())
        expect(back.getMonth()).toBe(original.getMonth())
        expect(back.getDate()).toBe(original.getDate())
    })

    it("applies hours and minutes when provided", () => {
        const result = jalaliToGregorian({ jy: 1403, jm: 1, jd: 1 }, 14, 30)
        expect(result.getHours()).toBe(14)
        expect(result.getMinutes()).toBe(30)
    })

    it("defaults to midnight when hours/minutes not provided", () => {
        const result = jalaliToGregorian({ jy: 1403, jm: 1, jd: 1 })
        expect(result.getHours()).toBe(0)
        expect(result.getMinutes()).toBe(0)
    })
})

describe("jalaliMonthLength", () => {
    it("returns 31 for first 6 months of Jalali year", () => {
        for (let m = 1; m <= 6; m++) {
            expect(jalaliMonthLength(1403, m)).toBe(31)
        }
    })

    it("returns 30 for months 7 to 11", () => {
        for (let m = 7; m <= 11; m++) {
            expect(jalaliMonthLength(1403, m)).toBe(30)
        }
    })

    it("returns 29 for Esfand in a non-leap year", () => {
        expect(jalaliMonthLength(1402, 12)).toBe(29)
    })

    it("returns 30 for Esfand in a leap year", () => {
        // 1403 is a leap year
        expect(jalaliMonthLength(1403, 12)).toBe(30)
    })
})

describe("toPersianDigits", () => {
    it("converts ASCII digits to Persian digits", () => {
        expect(toPersianDigits("1234567890")).toBe("۱۲۳۴۵۶۷۸۹۰")
    })

    it("converts number input", () => {
        expect(toPersianDigits(42)).toBe("۴۲")
    })

    it("leaves non-digit characters unchanged", () => {
        expect(toPersianDigits("12/06/1403")).toBe("۱۲/۰۶/۱۴۰۳")
    })

    it("returns empty string for empty input", () => {
        expect(toPersianDigits("")).toBe("")
    })

    it("converts zero correctly", () => {
        expect(toPersianDigits(0)).toBe("۰")
    })
})

describe("formatJalaliDisplay", () => {
    it("returns empty string for null", () => {
        expect(formatJalaliDisplay(null)).toBe("")
    })

    it("formats date with month name and Persian digits", () => {
        const date = new Date(2024, 0, 1) // 1402/10/11
        const result = formatJalaliDisplay(date)
        expect(result).toContain("دی") // month 10 = Dey
        expect(result).toContain("۱۴۰۲")
    })

    it("contains a Jalali month name", () => {
        const date = new Date(2024, 2, 20) // 1403/01/01 = Farvardin
        const result = formatJalaliDisplay(date)
        expect(result).toContain("فروردین")
    })

    it("uses all month names correctly", () => {
        expect(JALALI_MONTH_NAMES).toHaveLength(12)
        expect(JALALI_MONTH_NAMES[0]).toBe("فروردین")
        expect(JALALI_MONTH_NAMES[11]).toBe("اسفند")
    })
})

describe("formatJalaliDateTimeDisplay", () => {
    it("returns empty string for null", () => {
        expect(formatJalaliDateTimeDisplay(null)).toBe("")
    })

    it("includes time with colon separator", () => {
        const date = new Date(2024, 0, 1, 14, 30)
        const result = formatJalaliDateTimeDisplay(date)
        expect(result).toContain(":")
        expect(result).toContain("-")
    })

    it("includes Persian digits for hours and minutes", () => {
        const date = new Date(2024, 0, 1, 9, 5)
        const result = formatJalaliDateTimeDisplay(date)
        // 09:05 in Persian
        expect(result).toContain("۰۹")
        expect(result).toContain("۰۵")
    })
})

describe("parseIsoSafely", () => {
    it("returns null for null input", () => {
        expect(parseIsoSafely(null)).toBeNull()
    })

    it("returns null for undefined", () => {
        expect(parseIsoSafely(undefined)).toBeNull()
    })

    it("returns null for empty string", () => {
        expect(parseIsoSafely("")).toBeNull()
    })

    it("returns null for invalid date string", () => {
        expect(parseIsoSafely("not-a-date")).toBeNull()
    })

    it("returns valid Date for ISO string", () => {
        const result = parseIsoSafely("2024-01-01T00:00:00Z")
        expect(result).toBeInstanceOf(Date)
        expect(result!.getFullYear()).toBe(2024)
    })

    it("returns valid Date for date-only string", () => {
        const result = parseIsoSafely("2024-06-15")
        expect(result).toBeInstanceOf(Date)
    })

    it("never returns Invalid Date", () => {
        const result = parseIsoSafely("2024-01-01")
        expect(result).not.toBeNull()
        expect(Number.isNaN(result!.getTime())).toBe(false)
    })
})

describe("toDateOnlyIso", () => {
    it("formats date as YYYY-MM-DD", () => {
        expect(toDateOnlyIso(new Date(2024, 0, 1))).toBe("2024-01-01")
    })

    it("pads month and day with zero", () => {
        expect(toDateOnlyIso(new Date(2024, 5, 5))).toBe("2024-06-05")
    })

    it("handles December correctly", () => {
        expect(toDateOnlyIso(new Date(2024, 11, 31))).toBe("2024-12-31")
    })
})

describe("toDateTimeIso", () => {
    it("formats as YYYY-MM-DDTHH:mm:ss without Z", () => {
        const date = new Date(2024, 0, 1, 14, 30, 0)
        const result = toDateTimeIso(date)
        expect(result).toBe("2024-01-01T14:30:00")
    })

    it("pads hours and minutes with zero", () => {
        const date = new Date(2024, 5, 5, 9, 5, 0)
        const result = toDateTimeIso(date)
        expect(result).toBe("2024-06-05T09:05:00")
    })

    it("does not include Z suffix — local time not UTC", () => {
        const result = toDateTimeIso(new Date(2024, 0, 1, 0, 0, 0))
        expect(result).not.toContain("Z")
    })
})
})