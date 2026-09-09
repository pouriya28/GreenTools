import type { Address } from "../types/Address"
import { IconPencil, IconTrash, IconStar, IconMapPin, IconUser, IconPhone, IconCheck } from "./icons"

interface AddressCardProps {
	address: Address
	selected?: boolean
	onSelect?: (address: Address) => void
	onEdit?: (address: Address) => void
	onDelete?: (address: Address) => void
	onSetDefault?: (address: Address) => void
}

/**
 * کارت نمایش یک آدرس ثبت‌شده. رنگ‌بندی فقط از توکن‌های themes.css استفاده می‌کند
 * تا در هر سه تم (light/dark/neon) بدون تغییر کد هماهنگ باشد.
 *
 * امنیت: دکمه‌های حذف/ویرایش/پیش‌فرض کردن فقط event را به بالا منتشر می‌کنند؛ تأییدیه قطعی (مانند
 * مدال تأیید قبل از حذف) در مسئولیت کامپوننت والد قرار دارد (مرجع: AddressList).
 */
export function AddressCard({ address, selected, onSelect, onEdit, onDelete, onSetDefault }: AddressCardProps) {
	const isSelectable = Boolean(onSelect)

	return (
		<div
			role={isSelectable ? "button" : undefined}
			tabIndex={isSelectable ? 0 : undefined}
			onClick={() => onSelect?.(address)}
			onKeyDown={(e) => {
				if (isSelectable && (e.key === "Enter" || e.key === " ")) {
					e.preventDefault()
					onSelect?.(address)
				}
			}}
			className={`relative rounded-2xl border bg-surface p-4 transition ${
				selected
					? "border-primary shadow-[0_0_20px_var(--primary-glow)]"
					: "border-border hover:border-primary/50"
			} ${isSelectable ? "cursor-pointer" : ""}`}
		>
			{selected && (
				<div className="absolute top-4 left-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-background">
					<IconCheck className="h-3.5 w-3.5" />
				</div>
			)}

			<div className="flex items-start justify-between gap-3 pl-8">
				<div className="flex items-center gap-2">
					<span className="font-bold text-text">{address.title || "آدرس"}</span>
					{address.is_default && (
						<span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
							<IconStar className="h-3 w-3" />
							پیش‌فرض
						</span>
					)}
				</div>
			</div>

			<div className="mt-2 flex items-start gap-2 text-sm text-text-secondary">
				<IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
				<span>
					{address.province.name}، {address.city.name}
					{address.district ? `، ${address.district}` : ""} — {address.address_line}
				</span>
			</div>

			<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
				<span className="flex items-center gap-1">
					<IconUser className="h-3.5 w-3.5" />
					{address.recipient_name}
				</span>
				<span className="flex items-center gap-1" dir="ltr">
					<IconPhone className="h-3.5 w-3.5" />
					{address.recipient_phone}
				</span>
			</div>

			{(onEdit || onDelete || onSetDefault) && (
				<div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
					{onSetDefault && !address.is_default && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation()
								onSetDefault(address)
							}}
							className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-background"
						>
							<IconStar className="h-3.5 w-3.5" />
							تنظیم به پیش‌فرض
						</button>
					)}
					{onEdit && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation()
								onEdit(address)
							}}
							className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-background"
						>
							<IconPencil className="h-3.5 w-3.5" />
							ویرایش
						</button>
					)}
					{onDelete && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation()
								// تأییدیه قطعی در مسئولیت AddressList قرار دارد تا حذف تصادفی رخ ندهد.
								onDelete(address)
							}}
							className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-error transition hover:bg-error/10"
						>
							<IconTrash className="h-3.5 w-3.5" />
							حذف
						</button>
					)}
				</div>
			)}
		</div>
	)
}
