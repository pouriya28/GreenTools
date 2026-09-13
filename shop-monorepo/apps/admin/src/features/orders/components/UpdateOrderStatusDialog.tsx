import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useOrderMutations } from "../hooks/useOrderMutations"
import { ORDER_STATUS_LABELS, ORDER_STATUS_TRANSITIONS } from "../types/Order"
import type { OrderDetail, OrderStatus } from "../types/Order"

interface UpdateOrderStatusDialogProps {
	order: OrderDetail | null
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function UpdateOrderStatusDialog({ order, open, onOpenChange }: UpdateOrderStatusDialogProps) {
	const { updateStatus } = useOrderMutations()
	const [nextStatus, setNextStatus] = useState<string>("")

	if (!order) return null

	const allowedNextStatuses = ORDER_STATUS_TRANSITIONS[order.status]

	function handleSubmit() {
		if (!order || !nextStatus) return
		updateStatus.mutate(
			{ id: order.id, status: nextStatus as OrderStatus },
			{ onSuccess: () => onOpenChange(false) }
		)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent dir="rtl">
				<DialogHeader>
					<DialogTitle>تغییر وضعیت سفارش #{order.id}</DialogTitle>
					<DialogDescription>وضعیت فعلی: {ORDER_STATUS_LABELS[order.status]}</DialogDescription>
				</DialogHeader>

				{allowedNextStatuses.length === 0 ? (
					<p className="text-sm text-text-2">این سفارش در وضعیت نهایی است و قابل تغییر نیست.</p>
				) : (
					<Select value={nextStatus} onValueChange={setNextStatus}>
						<SelectTrigger>
							<SelectValue placeholder="وضعیت جدید را انتخاب کنید" />
						</SelectTrigger>
						<SelectContent>
							{allowedNextStatuses.map((status) => (
								<SelectItem key={status} value={status}>
									{ORDER_STATUS_LABELS[status]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}

				<DialogFooter>
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button>
					<Button
						type="button"
						onClick={handleSubmit}
						disabled={!nextStatus || updateStatus.isPending || allowedNextStatuses.length === 0}
					>
						{updateStatus.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
						ثبت تغییر
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}