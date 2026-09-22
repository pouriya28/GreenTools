import { useState } from "react"
import { AlertTriangle, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useShippingMethods } from "../hooks/useShippingMethods"
import { ShippingMethodTable } from "../components/ShippingMethodTable"
import { ShippingMethodFormDialog } from "../components/ShippingMethodFormDialog"
import { DeleteShippingMethodDialog } from "../components/DeleteShippingMethodDialog"
import type { ShippingMethod } from "../types/ShippingMethod"

export default function ShippingMethodsPage() {
	const { data: shippingMethods, isLoading, isError, refetch, isFetching } = useShippingMethods()
	const [formDialogOpen, setFormDialogOpen] = useState(false)
	const [editingShippingMethod, setEditingShippingMethod] = useState<ShippingMethod | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<ShippingMethod | null>(null)

	function handleCreate() {
		setEditingShippingMethod(null)
		setFormDialogOpen(true)
	}

	function handleEdit(shippingMethod: ShippingMethod) {
		setEditingShippingMethod(shippingMethod)
		setFormDialogOpen(true)
	}

	function handleFormOpenChange(open: boolean) {
		setFormDialogOpen(open)
		if (!open) setEditingShippingMethod(null)
	}

	function handleDeleteOpenChange(open: boolean) {
		if (!open) setDeleteTarget(null)
	}

	return (
		<div className="flex flex-col gap-6" dir="rtl">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-bold text-text-1">روش‌های ارسال</h1>
					<p className="text-sm text-text-2">
						{shippingMethods ? `${shippingMethods.length} روش ارسال` : "مدیریت روش‌های ارسال فروشگاه"}
					</p>
				</div>
				<Button onClick={handleCreate}>
					<Plus className="h-4 w-4" />
					افزودن روش ارسال
				</Button>
			</div>

			{isLoading && (
				<div className="flex items-center justify-center gap-2 rounded-xl border border-border py-16 text-text-2">
					<Loader2 className="h-5 w-5 animate-spin" />
					در حال بارگذاری روش‌های ارسال...
				</div>
			)}

			{isError && (
				<div className="flex flex-col items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 py-12 text-danger">
					<AlertTriangle className="h-6 w-6" />
					<p className="text-sm">دریافت روش‌های ارسال با خطا مواجه شد.</p>
					<Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
						{isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
						تلاش دوباره
					</Button>
				</div>
			)}

			{!isLoading && !isError && (
				<ShippingMethodTable shippingMethods={shippingMethods ?? []} onEdit={handleEdit} onDeleteRequest={setDeleteTarget} />
			)}

			<ShippingMethodFormDialog open={formDialogOpen} onOpenChange={handleFormOpenChange} shippingMethod={editingShippingMethod} />
			<DeleteShippingMethodDialog shippingMethod={deleteTarget} open={deleteTarget !== null} onOpenChange={handleDeleteOpenChange} />
		</div>
	)
}