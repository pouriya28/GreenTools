import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { ServerCrash } from "lucide-react"
import { useMaintenanceStore } from "@/shared/store/maintenanceStore"

export function MaintenanceOverlay() {
  const { active, retryAfter } = useMaintenanceStore()
  const [countdown, setCountdown] = useState(retryAfter ?? 0)

  useEffect(() => {
    if (!active) return
    setCountdown(retryAfter ?? 0)
    if (!retryAfter) return
    const interval = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [active, retryAfter])

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          dir="rtl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-zinc-950/95 backdrop-blur-md text-center px-6"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="rounded-full p-5 border border-fuchsia-500/30 shadow-[0_0_50px_-8px_theme(colors.fuchsia.500)]"
          >
            <ServerCrash className="h-10 w-10 text-fuchsia-400" />
          </motion.div>
          <h2 className="text-lg font-semibold text-zinc-100">
            سرویس موقتاً در دسترس نیست
          </h2>
          <p className="text-sm text-zinc-400 max-w-sm">
            در حال انجام به‌روزرسانی هستیم. لطفاً کمی صبر کنید
            {countdown > 0 && <> — تلاش مجدد تا {countdown} ثانیه دیگر</>}.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}