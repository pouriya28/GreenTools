import { useState } from "react"
import { PowerOff, Power } from "lucide-react"
import { useStoreStatus } from "../hooks/useStoreStatus"
import { useStoreStatusMutations } from "../hooks/useStoreStatusMutations"
import { ConfirmActionDialog } from "@/features/pricing/components/shared/ConfirmActionDialog"
import { ApiError } from "@/shared/lib/apiError"

/**
 * دکمه‌ی سراسری باز/بسته کردن فروشگاه. بستن از طریق ConfirmActionDialog
 * (با فیلد دلیل اختیاری) تایید می‌شود تا از کلیک تصادفی جلوگیری بشه؛
 * چون بستن فروشگاه یعنی توقف کامل فروش برای همه‌ی کاربران.
 */
export function StoreStatusToggle() {
	const statusQuery = useStoreStatus()
	const { close, open } = useStoreStatusMutations()

	const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
	const [reason, setReason] = useState("")

	if (statusQuery.isLoading || !statusQuery.data) {
		return null
	}

	const status = statusQuery.data
	const errorMessage =
		(close.isError && close.error instanceof ApiError && close.error.message) ||
		(open.isError && open.error instanceof ApiError && open.error.message) ||
		null

	async function handleConfirmClose() {
		try {
			await close.mutateAsync(reason || undefined)
			setIsCloseDialogOpen(false)
			setReason("")
		} catch {
			// خطا در errorMessage نمایش داده می‌شود
		}
	}

	if (status.is_open) {
		return (
			<>
				<button
					type="button"
					onClick={() => setIsCloseDialogOpen(true)}
					className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-medium text-danger transition hover:bg-danger/20"
				>
					<PowerOff className="h-4 w-4" />
					بستن فروشگاه
				</button>

				<ConfirmActionDialog
					open={isCloseDialogOpen}
					onOpenChange={setIsCloseDialogOpen}
					title="بستن فروشگاه"
					description={
						<div className="flex flex-col gap-3">
							<span>با بستن فروشگاه، امکان ثبت سفارش جدید برای همه‌ی کاربران غیرفعال می‌شود. ادامه می‌دهید؟</span>
							<textarea
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								placeholder="دلیل بستن (اختیاری)"
								rows={2}
								className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
							/>
						</div>
					}
					confirmLabel="بله، فروشگاه بسته شود"
					isBusy={close.isPending}
					destructive
					errorMessage={errorMessage}
					onConfirm={handleConfirmClose}
				/>
			</>
		)
	}

	return (
		<button
			type="button"
			onClick={() => open.mutate()}
			disabled={open.isPending}
			className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm font-medium text-green-600 transition hover:bg-green-500/20 disabled:opacity-50"
		>
			<Power className="h-4 w-4" />
			{open.isPending ? "در حال باز کردن…" : "باز کردن فروشگاه"}
		</button>
	)
}