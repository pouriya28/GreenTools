import { useEffect, useRef, useState, type ReactNode } from "react"
import { refreshRequest } from "./api/authApi"
import { useAuthStore } from "./store/authStore"

export function AuthProvider({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession)
  const clearSession = useAuthStore((s) => s.clearSession)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const hasRunRef = useRef(false)

  useEffect(() => {
    if (hasRunRef.current) return
    hasRunRef.current = true

    refreshRequest()
      .then((data) => {
        setSession(data.data.access_token, data.data.user)
      })
      .catch(() => {
        clearSession()
      })
      .finally(() => {
        setIsBootstrapping(false)
      })
  }, [setSession, clearSession])

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-0">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    )
  }

  return <>{children}</>
}