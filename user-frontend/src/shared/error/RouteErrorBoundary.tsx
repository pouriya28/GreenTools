import { isRouteErrorResponse, useRouteError, Link } from "react-router-dom"

export function RouteErrorBoundary() {
  const error = useRouteError()

  const status = isRouteErrorResponse(error) ? error.status : null
  const message =
    isRouteErrorResponse(error) && error.status === 404
      ? "صفحه‌ای که دنبالش بودید پیدا نشد."
      : "مشکلی در بارگذاری این صفحه پیش اومد."

  return (
    <div dir="rtl" className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-6">
      {status && <h1 className="text-3xl font-bold text-zinc-100">{status}</h1>}
      <p className="text-zinc-400">{message}</p>
      <Link to="/" className="text-fuchsia-400 hover:underline">
        بازگشت به صفحه‌ی اصلی
      </Link>
    </div>
  )
}