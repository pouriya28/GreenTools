import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppShell } from "@/components/AppShell"
import { ProtectedRoute } from "../components/ProtectedRoute"
import LoginPage from "@/features/auth/pages/LoginPage"
import CategoriesPage from "@/features/categories/pages/CategoriesPage"
import TrashedCategoriesPage from "@/features/categories/pages/Trashedcategoriespage"
import ProductsPage from "@/features/products/pages/ProductsPage"
import TrashedProductsPage from "@/features/products/pages/TrashedProductsPage"
import PricingPage from "@/features/pricing/pages/PricingPage"
import ShippingMethodsPage from "@/features/shippingMethods/pages/ShippingMethodsPage"
import { CommentModerationPage } from "@/features/comments/pages/CommentModerationPage"
import OrdersPage from "@/features/orders/pages/OrdersPage"
function Placeholder({ title }: { title: string }) {
  return <div className="text-xl font-semibold text-text-1">{title}</div>
}

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", element: <Placeholder title="داشبورد" /> },
          { path: "categories", element: <CategoriesPage /> },
          { path: "categories/trash", element: <TrashedCategoriesPage /> },
          { path: "products", element: <ProductsPage /> },
          { path: "products/trash", element: <TrashedProductsPage /> },
          // بخش مدیریت نرخ ارز/قیمت‌ها (override دستی + بررسی پیشنهادها) —
          // این مسیر هم زیر ProtectedRoute است، پس فقط کاربران authenticated بهش دسترسی
          // دارند؛ مجوزه‌های دقیق‌تر (prices.review / prices.manual_override) همون‌طور که بک‌اند
          // پیاده‌سازی شده، روی هر درخواست API به صورت 403 اعمال می‌شوند (AuthUser فعلاً فقط
          // id/name/type رو دارد، لیست permission جزو‌جزی ندارد).
          { path: "pricing", element: <PricingPage /> },
          {
            path: "shipping-methods",
            element: <ShippingMethodsPage />,
          },
          { path: "comments", element: <CommentModerationPage /> },
          { path: "orders", element: <OrdersPage /> },
        ],
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
])
