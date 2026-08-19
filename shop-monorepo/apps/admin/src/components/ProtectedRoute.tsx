import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store/authStore"

// فقط این دو مقدار AuthUser.type اجازه‌ی ورود به مسیرهای این گارد رو دارند (تأییدشده توسط کاربر).
const STAFF_USER_TYPES = ["admin", "staff"]

export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)

  if (status !== "authenticated") {
    return <Navigate to="/login" replace />
  }

  // دفاع در عمق: این پنل فقط مسیرهای ادمین/مدیریت محصولاتهست؛ هر کاربر لاگین‌کرده‌ای که admin یا
  // staff نباشد (مشتری عادی و...) به لاگین هدایت می‌شه. امنیت واقعی همچنان فقط توسط بک‌اند
  // (middleware های staff.access و مشابه) تامین می‌شود؛ این یک لایه‌ی دفاع اضافی روی فرانته.
  if (!user || !STAFF_USER_TYPES.includes(user.type)) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
