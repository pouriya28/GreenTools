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
