import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { notificationService } from "./notification.service";
import { NotificationItem } from "./NotificationItem";
import type { Notification } from "./notification.types";
import { useMediaQuery } from "../../features/products/hooks/useMediaQuery";

export function NotificationContainer() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const isMobile = useMediaQuery("(max-width:768px)");

  useEffect(() => {
    return notificationService.subscribe(setNotifications);
  }, []);

  return (
    <div
      className={`
        fixed flex flex-col gap-2 p-4
        z-[9999]
        ${isMobile ? "bottom-0 left-1/2 -translate-x-1/2 items-center" : "bottom-4 right-4 items-end"}
      `}
    >
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={() => notificationService.dismiss(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}