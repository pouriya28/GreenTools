import { useShippingMethodMutations } from "../hooks/useShippingMethodMutations"
import { ConfirmActionDialog } from "@/features/pricing/components/shared/ConfirmActionDialog"
import { ApiError } from "@/shared/lib/apiError"
import type { ShippingMethod } from "../types/ShippingMethod"

interface DeleteShippingMethodDialogProps {
	shippingMethod: ShippingMethod | null
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function DeleteShippingMethodDialog({ shippingMethod, open, onOpenChange }: DeleteShippingMethodDialogProps) {
	const { remove } = useShippingMethodMutations()
	const errorMessage = remove.isError && remove.error instanceof ApiError ? remove.error.message : null

	async function handleConfirm() {
		if (!shippingMethod) return
		try {
			await remove.mutateAsync(shippingMethod.id)
			onOpenChange(false)
		} catch {
			// خطا در errorMessage نمایش داده می‌شود
		}
	}

	return (
		<ConfirmActionDialog
			open={open}
			onOpenChange={onOpenChange}
			title="حذف روش ارسال"
			description={
				shippingMethod ? (
					<span>آیا از حذف روش ارسال «{shippingMethod.name}» مطمئن هستید؟</span>
				) : (
					""
				)
			}
			confirmLabel="بله، حذف شود"
			isBusy={remove.isPending}
			destructive
			errorMessage={errorMessage}
			onConfirm={handleConfirm}
		/>
	)
}