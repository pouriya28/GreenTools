import { useState } from "react"
import { useAddresses } from "../hooks/useAddresses"
import { useDeleteAddress } from "../hooks/useDeleteAddress"
import { useSetDefaultAddress } from "../hooks/useSetDefaultAddress"
import { AddressCard } from "./AddressCard"
import { AddressForm } from "./AddressForm"
import type { Address } from "../types/Address"
import { IconPlus } from "./icons"

interface AddressListProps {
	/** When true, cards become clickable and report the chosen address via onSelect (checkout flow). */
	selectable?: boolean
	selectedAddressId?: number | string
	onSelect?: (address: Address) => void
}

/**
 * فهرست آدرس‌های کاربر. هم در داشبورد (مدیریت آدرس‌ها) و هم در چک‌اوت (انتخاب آدرس تحویل) قابل‌استفاده است.
 * ایجاد/ویرایش آدرس به‌صورت درون‌خطی با AddressForm انجام می‌شود.
 *
 * امنیت: حذف فقط پس از تأیید صریح کاربر انجام می‌شود؛ هیچ آدرسی بدون تأیید حذف نمی‌شود. مالکیت آدرس (userId)
 * همیشه توسط بک‌اند از روی توکن احراز شده بررسی می‌شود (IDOR در کلاینت قابل دورزدن نیست).
 */
export function AddressList({ selectable = false, selectedAddressId, onSelect }: AddressListProps) {
	const addressesQuery = useAddresses()
	const deleteAddress = useDeleteAddress()
	const setDefaultAddress = useSetDefaultAddress()

	const [isCreating, setIsCreating] = useState(false)
	const [editingAddress, setEditingAddress] = useState<Address | null>(null)
	const [pendingDeleteId, setPendingDeleteId] = useState<number | string | null>(null)

	if (isCreating) {
		return (
			<AddressForm
				submitLabel="ثبت آدرس"
				onCancel={() => setIsCreating(false)}
				onSuccess={() => setIsCreating(false)}
			/>
		)
	}

	if (editingAddress) {
		return (
			<AddressForm
				address={editingAddress}
				submitLabel="ذخیرهٔ تغییرات"
				onCancel={() => setEditingAddress(null)}
				onSuccess={() => setEditingAddress(null)}
			/>
		)
	}

	async function handleDelete(address: Address) {
		// تأییدیه قطعی قبل از عملیات مخرب‌کننده؛ از حذف تصادفی با یک کلیک جلوگیری می‌کند.
		if (pendingDeleteId !== address.id) {
			setPendingDeleteId(address.id)
			return
		}
		try {
			await deleteAddress.mutateAsync(address.id)
		} finally {
			setPendingDeleteId(null)
		}
	}

	if (addressesQuery.isLoading) {
		return <p className="py-6 text-center text-sm text-muted">در حال بارگذاری آدرس‌ها…</p>
	}

	if (addressesQuery.isError) {
		return (
			<div className="rounded-2xl border border-error/30 bg-error/5 px-4 py-6 text-center text-sm text-error">
				خطا در بارگذاری آدرس‌ها. لطفاً دوباره تلاش کنید.
			</div>
		)
	}

	const addresses = addressesQuery.data ?? []

	return (
		<div className="flex flex-col gap-3">
			{addresses.length === 0 && (
				<div className="rounded-2xl border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
					هنوز آدرسی ثبت نکرده‌اید.
				</div>
			)}

			{addresses.map((address) => (
				<AddressCard
					key={address.id}
					address={address}
					selected={selectable ? address.id === selectedAddressId : undefined}
					onSelect={selectable ? onSelect : undefined}
					onEdit={setEditingAddress}
					onDelete={handleDelete}
					onSetDefault={(a) => setDefaultAddress.mutate(a.id)}
				/>
			))}

			{addresses.some((a) => pendingDeleteId === a.id) && (
				<p className="text-center text-xs text-error">برای حذف قطعی دوباره روی دکمهٔ حذف بزنید.</p>
			)}

			<button
				type="button"
				onClick={() => setIsCreating(true)}
				className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 py-3.5 text-sm font-bold text-primary transition hover:bg-primary/10"
			>
				<IconPlus className="h-4 w-4" />
				افزودن آدرس جدید
			</button>
		</div>
	)
}
