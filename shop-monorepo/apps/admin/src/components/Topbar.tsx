// src/components/Topbar.tsx
import { useState } from "react"
import { Sun, Moon, LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTheme } from "@/shared/theme/useTheme"
import { useAuthStore } from "@/features/auth/store/authStore"
import { logoutRequest } from "@/features/auth/api/authApi"
import { LogoutConfirmDialog } from "./LogoutConfirmDialog"

export function Topbar() {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const clearSession = useAuthStore((s) => s.clearSession)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  async function performLogout() {
    setLogoutDialogOpen(false)
    try {
      await logoutRequest()
    } catch {
      // حتی اگه درخواست fail بشه، سشن محلی رو پاک می‌کنیم
    } finally {
      clearSession()
      navigate("/login", { replace: true })
    }
  }

  const initials = user?.name?.trim()?.charAt(0)?.toUpperCase() ?? "?"

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-border bg-bg-1 px-6">
        <div className="text-sm text-text-3">{/* breadcrumb بعداً */}</div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="rounded-md p-2 text-text-2 hover:bg-bg-3 hover:text-text-1"
            aria-label="تغییر تم"
          >
            {theme === "dark" ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </button>

          <div className="mx-1 h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-semibold text-white">
              {initials}
            </div>
            <span className="text-sm text-text-1">{user?.name}</span>
          </div>

          <button
            onClick={() => setLogoutDialogOpen(true)}
            className="rounded-md p-2 text-text-2 hover:bg-danger/10 hover:text-danger"
            aria-label="خروج"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        onConfirmed={performLogout}
      />
    </>
  )
}