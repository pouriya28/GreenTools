const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/**
 * اعداد فارسی/عربی رو به انگلیسی تبدیل می‌کنه (صرف‌نظر از نوع کیبورد کاربر)
 * و هر کاراکتر غیرعددی رو حذف می‌کنه.
 */
export function normalizeDigits(input: string): string {
  let result = "";
  for (const char of input) {
    const persianIndex = PERSIAN_DIGITS.indexOf(char);
    const arabicIndex = ARABIC_DIGITS.indexOf(char);
    if (persianIndex > -1) {
      result += persianIndex;
    } else if (arabicIndex > -1) {
      result += arabicIndex;
    } else if (/\d/.test(char)) {
      result += char;
    }
    // هر کاراکتر دیگه (حرف، فاصله، غیره) حذف می‌شه
  }
  return result;
}

/** فقط کاراکترهای مجاز یک ایمیل (لاتین) رو نگه می‌داره؛ فارسی/فاصله/کاراکتر غیرمجاز حذف می‌شه */
export function sanitizeEmailInput(input: string): string {
  return input.replace(/[^a-zA-Z0-9@._\-+]/g, "");
}