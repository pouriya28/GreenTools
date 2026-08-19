import type { NotificationTone } from "../error/statusConfig";

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface Notification {
  id: string;
  tone: NotificationTone;
  message: string;
  duration?: number; // ms, undefined = ماندگار تا بسته شدن دستی
  action?: NotificationAction;
}

export type NotificationInput = Omit<Notification, "id">;