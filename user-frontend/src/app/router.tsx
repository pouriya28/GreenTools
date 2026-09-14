// src/app/router.tsx (یا هر نامی که این فایل دارد) — فقط خطوط تغییریافته
import { createBrowserRouter } from "react-router-dom"
import { lazy, Suspense, type ReactNode } from "react"
import { RootLayout } from "./RootLayout"
import { RouteErrorBoundary } from "@/shared/error/RouteErrorBoundary"
import { NotFoundPage } from "@/shared/error/NotFoundPage"
import { PageLoader } from "@/shared/components/PageLoader"

const Home = lazy(() =>
  import("@/pages/Home/Home").then((m) => ({ default: m.Home }))
)
const ProductsPage = lazy(() =>
  import("@/features/products/components/ProductsPage/ProductsPage").then((m) => ({
    default: m.ProductsPage,
  }))
)
const ProductPage = lazy(() =>
  import("@/features/products/components/ProductPage/ProductPage").then((m) => ({
    default: m.ProductPage,
  }))
)
const CartPage = lazy(() =>
  import("@/features/cart/components/CartPage").then((m) => ({
    default: m.CartPage,
  })),
)
const SupportPage = lazy(() =>
  import("@/pages/Support/SupportPage").then((m) => ({
    default: m.SupportPage,
  })),
)
const CheckoutPage = lazy(() =>
  import("@/features/checkout/components/CheckoutPage").then((m) => ({
    default: m.CheckoutPage,
  })),
)
const CategoriesPage = lazy(() =>
  import("@/features/categories/components/CategoriesPage/CategoriesPage").then((m) => ({
    default: m.CategoriesPage,
  })),
)
const WishlistPage = lazy(() =>
  import("@/features/wishlist/pages/WishlistPage").then((m) => ({
    default: m.WishlistPage,
  })),
)
function withSuspense(element: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: withSuspense(<Home />) },
      { path: "products", element: withSuspense(<ProductsPage />) },
      { path: "products/:slug", element: withSuspense(<ProductPage />) },
      { path: "cart", element: withSuspense(<CartPage />) },
      { path: "checkout", element: withSuspense(<CheckoutPage />) },
      { path: "support", element: withSuspense(<SupportPage />) },
      { path: "categories", element: withSuspense(<CategoriesPage />) },
      { path: "wishlist", element: withSuspense(<WishlistPage />) },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])