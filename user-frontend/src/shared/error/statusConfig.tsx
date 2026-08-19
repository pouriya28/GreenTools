import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaBan,
  FaSearch,
  FaClock,
  FaSkullCrossbones,
} from "react-icons/fa";
import type { ComponentType } from "react";

export type NotificationTone = "success" | "info" | "warning" | "error" | "critical";

interface StatusConfig {
  tone: NotificationTone;
  icon: ComponentType;
  colorClass: string;
  defaultMessage: string;
}

const DEFAULT: StatusConfig = {
  tone: "error",
  icon: FaExclamationTriangle,
  colorClass: "bg-error text-white",
  defaultMessage: "خطایی رخ داد. لطفاً دوباره تلاش کنید.",
};

const STATUS_MAP: Record<number, StatusConfig> = {
  200: { tone: "success", icon: FaCheckCircle, colorClass: "bg-success text-white", defaultMessage: "عملیات با موفقیت انجام شد." },
  201: { tone: "success", icon: FaCheckCircle, colorClass: "bg-success text-white", defaultMessage: "با موفقیت ایجاد شد." },
  204: { tone: "info", icon: FaCheckCircle, colorClass: "bg-info text-white", defaultMessage: "انجام شد." },
  400: { tone: "warning", icon: FaExclamationTriangle, colorClass: "bg-warning text-white", defaultMessage: "درخواست نامعتبر است." },
  401: { tone: "error", icon: FaBan, colorClass: "bg-error text-white", defaultMessage: "نشست شما منقضی شده است." },
  403: { tone: "warning", icon: FaBan, colorClass: "bg-orange-500 text-white", defaultMessage: "شما دسترسی لازم را ندارید." },
  404: { tone: "info", icon: FaSearch, colorClass: "bg-muted text-white", defaultMessage: "مورد موردنظر پیدا نشد." },
  409: { tone: "warning", icon: FaExclamationTriangle, colorClass: "bg-orange-500 text-white", defaultMessage: "این عملیات با وضعیت فعلی تداخل دارد." },
  422: { tone: "warning", icon: FaExclamationTriangle, colorClass: "bg-warning text-white", defaultMessage: "اطلاعات وارد شده معتبر نیست." },
  429: { tone: "warning", icon: FaClock, colorClass: "bg-purple-600 text-white", defaultMessage: "درخواست‌های زیادی ارسال کرده‌اید. کمی صبر کنید." },
  500: { tone: "critical", icon: FaSkullCrossbones, colorClass: "bg-red-900 text-white", defaultMessage: "خطای سرور رخ داد." },
  503: { tone: "critical", icon: FaTimesCircle, colorClass: "bg-error text-white", defaultMessage: "سرویس در حال حاضر در دسترس نیست." },
};

export function getStatusConfig(status: number): StatusConfig {
  return STATUS_MAP[status] ?? DEFAULT;
}

/**
 * پیام امن برای نمایش به کاربر.
 * برای خطاهای سرور (5xx) هیچ‌وقت پیام خام بک‌اند رو trust نمی‌کنیم مگر این‌که
 * صراحتاً از سمت بک‌اند برای کاربر نوشته شده باشه (که طبق قرارداد message همینه)،
 * ولی به‌عنوان لایه‌ی دفاعی دوم، طول و محتوا رو هم چک می‌کنیم.
 */
export function getSafeMessage(status: number, backendMessage?: string): string {
  const config = getStatusConfig(status);

  if (!backendMessage) return config.defaultMessage;

  const looksLikeStackTrace =
    /Traceback|File "|line \d+|Exception|at \w+\.\w+\(/.test(backendMessage);

  if (status >= 500 && looksLikeStackTrace) {
    return config.defaultMessage;
  }

  return backendMessage;
}