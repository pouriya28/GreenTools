import type { Notification, NotificationInput } from "./notification.types";

type Listener = (notifications: Notification[]) => void;

let notifications: Notification[] = [];
let listeners: Listener[] = [];

function emit() {
  listeners.forEach((listener) => listener(notifications));
}

function push(input: NotificationInput): string {
  const id = crypto.randomUUID();
  const notification: Notification = { id, duration: 4000, ...input };

  notifications = [...notifications, notification];
  emit();

  if (notification.duration) {
    setTimeout(() => dismiss(id), notification.duration);
  }

  return id;
}

function dismiss(id: string) {
  notifications = notifications.filter((n) => n.id !== id);
  emit();
}

function subscribe(listener: Listener): () => void {
  listeners.push(listener);
  listener(notifications);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export const notificationService = {
  push,
  dismiss,
  subscribe,
  success: (message: string, opts?: Partial<NotificationInput>) =>
    push({ tone: "success", message, ...opts }),
  error: (message: string, opts?: Partial<NotificationInput>) =>
    push({ tone: "error", message, ...opts }),
  warning: (message: string, opts?: Partial<NotificationInput>) =>
    push({ tone: "warning", message, ...opts }),
  info: (message: string, opts?: Partial<NotificationInput>) =>
    push({ tone: "info", message, ...opts }),
};