import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

// چون فعلاً فقط سطح مشتری پیاده‌سازی می‌شه، allowedRoles حذف شد.
// وقتی پنل ادمین رو جدا پیاده کردی، یک AdminProtectedRoute مجزا بساز (مسیرهای staff کاملاً جداست).
export function ProtectedRoute() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}