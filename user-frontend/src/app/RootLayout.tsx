import { useEffect, useRef } from "react"
import { Outlet } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { Header } from "@/components/layout/Header"

export function RootLayout() {
  const initAuth = useAuthStore((s) => s.initAuth)
  const hasRunRef = useRef(false)

  useEffect(() => {
    if (hasRunRef.current) return
    hasRunRef.current = true
    initAuth()
  }, [initAuth])

  return (
    <>
      <Header />
      <main className="pt-24">
        <Outlet />
      </main>
    </>
  )
}