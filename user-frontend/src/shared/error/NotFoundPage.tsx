import { Link } from "react-router-dom"

export function NotFoundPage() {
  return (
    <div dir="rtl" className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-bold text-zinc-100">۴۰۴</h1>
      <p className="text-zinc-400">صفحه‌ای که دنبالش بودید پیدا نشد.</p>
      <Link to="/" className="text-fuchsia-400 hover:underline">
        بازگشت به صفحه‌ی اصلی
      </Link>
    </div>
  )
}