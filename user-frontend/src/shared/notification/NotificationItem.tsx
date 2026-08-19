import { motion } from "framer-motion";
import type { Notification } from "./notification.types";
import { getStatusConfig } from "../error/statusConfig";

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const { icon: Icon, colorClass } = getStatusConfig(
    notification.tone === "success" ? 200 :
    notification.tone === "error" ? 500 :
    notification.tone === "warning" ? 400 :
    notification.tone === "critical" ? 503 : 204
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40 }}
      className={`
        flex items-start gap-3
        rounded-xl px-4 py-3
        shadow-lg
        min-w-[280px] max-w-[360px]
        ${colorClass}
      `}
    >
      <span className="mt-0.5 shrink-0"><Icon /></span>

      <div className="flex-1 text-sm leading-relaxed">
        {notification.message}
        {notification.action && (
          <button
            onClick={notification.action.onClick}
            className="block mt-1 underline text-xs font-bold"
          >
            {notification.action.label}
          </button>
        )}
      </div>

      <button
        onClick={onClose}
        aria-label="بستن"
        className="text-white/80 hover:text-white shrink-0"
      >
        ×
      </button>
    </motion.div>
  );
}