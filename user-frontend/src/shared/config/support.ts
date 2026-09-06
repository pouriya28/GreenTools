// شماره‌ها باید بدون فاصله/خط‌تیره و در فرمت بین‌المللی بدون + باشند، مثل 989121234567
const rawWhatsappNumber = import.meta.env.VITE_SUPPORT_WHATSAPP_NUMBER ?? ""
const rawPhoneNumber = import.meta.env.VITE_SUPPORT_PHONE_NUMBER ?? ""
const rawTelegramUsername = import.meta.env.VITE_SUPPORT_TELEGRAM_USERNAME ?? ""

export const SUPPORT_WHATSAPP_NUMBER = rawWhatsappNumber
export const SUPPORT_PHONE_NUMBER = rawPhoneNumber
export const SUPPORT_TELEGRAM_USERNAME = rawTelegramUsername

export function buildSupportWhatsAppLink(message: string): string {
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodedMessage}`
}

export function buildSupportTelegramLink(): string {
  return `https://t.me/${SUPPORT_TELEGRAM_USERNAME}`
}

export function buildSupportTelLink(): string {
  return `tel:+${SUPPORT_PHONE_NUMBER}`
}