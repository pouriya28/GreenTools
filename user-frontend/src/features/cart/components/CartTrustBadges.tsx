// src/features/cart/components/CartTrustBadges.tsx
import { FiShield, FiHeadphones, FiCheckCircle, FiTruck } from "react-icons/fi"

const BADGES = [
  { icon: FiShield, title: "پرداخت امن", subtitle: "با درگاه‌های معتبر" },
  { icon: FiHeadphones, title: "پشتیبانی حرفه‌ای", subtitle: "پاسخگویی ۲۴/۷" },
  { icon: FiCheckCircle, title: "ضمانت کیفیت", subtitle: "محصولات اورجینال" },
  { icon: FiTruck, title: "ارسال سریع", subtitle: "به سراسر کشور" },
] as const

export function CartTrustBadges() {
  return (
    <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-bg-2 p-5 sm:grid-cols-4">
      {BADGES.map(({ icon: Icon, title, subtitle }) => (
        <div key={title} className="flex flex-col items-center gap-1.5 text-center">
          <Icon className="h-6 w-6 text-primary" />
          <span className="text-sm font-semibold text-text">{title}</span>
          <span className="text-xs text-text-3">{subtitle}</span>
        </div>
      ))}
    </div>
  )
}