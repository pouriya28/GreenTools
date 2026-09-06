import { motion } from "framer-motion";
import { FiPhoneCall, FiMessageCircle, FiSend, FiMessageSquare } from "react-icons/fi";
import {
  SUPPORT_PHONE_NUMBER,
  buildSupportTelLink,
  buildSupportTelegramLink,
  buildSupportWhatsAppLink,
} from "@/shared/config/support";

const DEFAULT_MESSAGE = "سلام، در مورد خرید یکی از محصولات نیاز به راهنمایی دارم.";

const CHANNELS = [
  {
    id: "phone",
    icon: FiPhoneCall,
    title: "تماس تلفنی مستقیم",
    description: SUPPORT_PHONE_NUMBER || "شماره تماس به‌زودی اضافه می‌شود",
    href: SUPPORT_PHONE_NUMBER ? buildSupportTelLink() : undefined,
    cta: "تماس بگیرید",
    external: false,
  },
  {
    id: "whatsapp",
    icon: FiMessageCircle,
    title: "واتساپ",
    description: "گفتگوی سریع و ارسال تصویر محصول",
    href: buildSupportWhatsAppLink(DEFAULT_MESSAGE),
    cta: "شروع گفتگو",
    external: true,
  },
  {
    id: "telegram",
    icon: FiSend,
    title: "تلگرام",
    description: "پیام بدید تا در سریع‌ترین زمان پاسخ بگیرید",
    href: buildSupportTelegramLink(),
    cta: "پیام در تلگرام",
    external: true,
  },
  {
    id: "live_chat",
    icon: FiMessageSquare,
    title: "چت آنلاین سایت",
    description: "به‌زودی",
    href: undefined,
    cta: "به‌زودی",
    external: false,
    disabled: true,
  },
] as const;

export function SupportPage() {
  return (
    <div dir="rtl" className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold text-text">تماس با پشتیبانی</h1>
        <p className="text-sm text-text-secondary">
          برای محصولاتی که نیاز به مشاوره‌ی فنی، نصب تخصصی یا هماهنگی قبل از خرید دارند، از یکی از راه‌های زیر با ما در ارتباط باشید.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CHANNELS.map((channel, index) => {
          const Icon = channel.icon;
          const isDisabled = "disabled" in channel && channel.disabled;

          const card = (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
              className={`flex h-full flex-col items-center gap-3 rounded-xl border border-border bg-surface p-6 text-center transition-colors duration-150 ${
                isDisabled ? "opacity-60" : "hover:border-primary"
              }`}
            >
              <Icon className="text-2xl text-primary" />
              <p className="font-medium text-text">{channel.title}</p>
              <p className="text-xs text-text-secondary">{channel.description}</p>
              <span
                className={`mt-auto rounded-lg px-4 py-2 text-sm font-medium ${
                  isDisabled ? "cursor-not-allowed bg-border text-text-secondary" : "bg-primary text-white"
                }`}
              >
                {channel.cta}
              </span>
            </motion.div>
          );

          if (!channel.href || isDisabled) {
            return <div key={channel.id}>{card}</div>;
          }

          return (
            <a
              key={channel.id}
              href={channel.href}
              target={channel.external ? "_blank" : undefined}
              rel={channel.external ? "noopener noreferrer" : undefined}
            >
              {card}
            </a>
          );
        })}
      </div>
    </div>
  );
}