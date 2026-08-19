import { useEffect, useRef, useState } from "react"
import { LogOut } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface LogoutConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmed: () => void
}

const COUNTDOWN_MS = 4000
const TICK_MS = 50

export function LogoutConfirmDialog({
  open,
  onOpenChange,
  onConfirmed,
}: LogoutConfirmDialogProps) {
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<number | null>(null)
  const startedAtRef = useRef<number>(0)

  function clearTimer() {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    if (!open) {
      clearTimer()
      setProgress(0)
      return
    }

    startedAtRef.current = Date.now()
    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current
      const pct = Math.min(100, (elapsed / COUNTDOWN_MS) * 100)
      setProgress(pct)

      if (elapsed >= COUNTDOWN_MS) {
        clearTimer()
        onConfirmed()
      }
    }, TICK_MS)

    return () => clearTimer()
  }, [open, onConfirmed])

  function handleCancel() {
    clearTimer()
    onOpenChange(false)
  }

  function handleLogoutNow() {
    clearTimer()
    onConfirmed()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-bg-1" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-text-1">
            <LogOut className="h-5 w-5 text-danger" />
            خروج از حساب کاربری
          </DialogTitle>
        </DialogHeader>

        <p className="py-2 text-sm text-text-2">
          در حال خروج خودکار... برای لغو روی «منصرف شدم» بزن.
        </p>

        <DialogFooter className="flex-row-reverse gap-2 sm:justify-start">
          <Button
            variant="destructive"
            onClick={handleLogoutNow}
            className="bg-danger text-white hover:bg-danger/90"
          >
            خروج
          </Button>

          <button
            onClick={handleCancel}
            className="relative flex-1 overflow-hidden rounded-md border border-border px-4 py-2 text-sm font-medium text-text-1"
          >
            <span
              className="absolute inset-y-0 right-0 bg-bg-3 transition-[width] duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
            <span className="relative">منصرف شدم</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}