import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppShell } from "@/components/AppShell"
import { ProtectedRoute } from "../components/ProtectedRoute"
import LoginPage from "@/features/auth/pages/LoginPage"
import CategoriesPage from "@/features/categories/pages/CategoriesPage"
import TrashedCategoriesPage from "@/features/categories/pages/Trashedcategoriespage"
import ProductsPage from "@/features/products/pages/ProductsPage"
import TrashedProductsPage from "@/features/products/pages/TrashedProductsPage"

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
        ],
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
])