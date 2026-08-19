import { notificationService } from "./notification.service";

// wrapper سبک برای استفاده‌ی راحت داخل کامپوننت‌ها (اختیاری، چون سرویس خودش قابل import مستقیمه)
export function useNotification() {
  return notificationService;
}