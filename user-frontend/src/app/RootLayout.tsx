import { useEffect, useRef } from "react"
import { Outlet } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"

export function RootLayout() {
  const initAuth = useAuthStore((s) => s.initAuth)
  const hasRunRef = useRef(false)

  useEffect(() => {
    if (hasRunRef.current) return
    hasRunRef.current = true
    initAuth()
  }, [initAuth])

  return <Outlet />
}