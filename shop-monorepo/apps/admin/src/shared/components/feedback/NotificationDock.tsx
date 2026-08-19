import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react"
import { cn } from "../../../lib/utils"
import {
  useNotificationStore,
  type NotificationItem,
  type NotificationKind,
} from "@/shared/store/notificationStore"

const ICONS: Record<NotificationKind, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

// اگه اسم CSS variableهای تمت فرق داره، فقط این نگاشت رو آداپت کن
const GLOW: Record<NotificationKind, string> = {
  success: "shadow-[0_0_24px_-4px_theme(colors.emerald.500)] border-emerald-500/40",
  error: "shadow-[0_0_24px_-4px_theme(colors.rose.500)] border-rose-500/40",
  warning: "shadow-[0_0_24px_-4px_theme(colors.amber.400)] border-amber-400/40",
  info: "shadow-[0_0_24px_-4px_theme(colors.fuchsia.500)] border-fuchsia-500/40",
}

const ICON_COLOR: Record<NotificationKind, string> = {
  success: "text-emerald-400",
  error: "text-rose-400",
  warning: "text-amber-300",
  info: "text-fuchsia-400",
}

function Capsule({ item }: { item: NotificationItem }) {
  const dismiss = useNotificationStore((s) => s.dismiss)
  const Icon = ICONS[item.kind]

  useEffect(() => {
    const t = setTimeout(() => dismiss(item.id), item.durationMs)
    return () => clearTimeout(t)
  }, [item.id, item.durationMs, dismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={cn(
        "relative flex items-center gap-2.5 overflow-hidden rounded-full border",
        "bg-zinc-900/90 backdrop-blur-xl px-4 py-2.5 pl-3 pr-9 min-w-[240px] max-w-sm",
        GLOW[item.kind]
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", ICON_COLOR[item.kind])} />
      <span className="text-sm text-zinc-100 leading-snug">{item.message}</span>

      <button
        onClick={() => dismiss(item.id)}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors"
        aria-label="بستن"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* نوار زمان زیرگلو */}
      <motion.span
        className={cn(
          "absolute bottom-0 right-0 left-0 h-[2px] origin-right",
          item.kind === "success" && "bg-emerald-400",
          item.kind === "error" && "bg-rose-400",
          item.kind === "warning" && "bg-amber-300",
          item.kind === "info" && "bg-fuchsia-400"
        )}
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: item.durationMs / 1000, ease: "linear" }}
      />
    </motion.div>
  )
}

export function NotificationDock() {
  const items = useNotificationStore((s) => s.items)
  const [expanded, setExpanded] = useState(false)

  const visible = expanded ? items : items.slice(-1)
  const hiddenCount = items.length - visible.length

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2"
      dir="rtl"
      onMouseEnter={() => items.length > 1 && setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <AnimatePresence mode="popLayout">
        {visible.map((item) => (
          <Capsule key={item.id} item={item} />
        ))}
      </AnimatePresence>

      {!expanded && hiddenCount > 0 && (
        <motion.button
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setExpanded(true)}
          className="text-xs text-zinc-400 hover:text-fuchsia-300 transition-colors"
        >
          +{hiddenCount} پیام دیگر
        </motion.button>
      )}
    </div>
  )
}