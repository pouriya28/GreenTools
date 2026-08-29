import { CheckCircle2 } from "lucide-react"

interface InlineSuccessBannerProps {
  message: string
}

// بازخورد مثبت ترین پس از عملیات‌های حساس (مثلاً ثبت نرخ دستی) — قبلاً دیالوگ‌ها
// بدون هیچ پیام موفقیت‌آمیز بسته می‌شدند و کاربر مطمئن نمی‌شد عملیاتش واقعاً انجام شده.
export function InlineSuccessBanner({ message }: InlineSuccessBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700"
    >
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
