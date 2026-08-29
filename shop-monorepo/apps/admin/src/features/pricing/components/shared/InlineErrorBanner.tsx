import { AlertTriangle } from "lucide-react"

interface InlineErrorBannerProps {
  message: string
}

// یک بنر خطای یک‌دست و قابل استفاده‌ی دوباره؛ ARIA role="alert" دارد تا
// صفحه‌خوان‌ها بلافاصله خطا رو اعلام کنن (دسترس‌پذیری بهتر = تجربهٔ کاربری امن‌تر،
// چون کاربر خطا رو از دست نمی‌ده).
export function InlineErrorBanner({ message }: InlineErrorBannerProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
