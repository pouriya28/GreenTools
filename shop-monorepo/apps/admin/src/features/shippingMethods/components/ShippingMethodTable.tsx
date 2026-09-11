import { Package, Pencil, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ShippingMethod } from "../types/ShippingMethod"

interface ShippingMethodTableProps {
	shippingMethods: ShippingMethod[]
	onEdit: (shippingMethod: ShippingMethod) => void
	onDeleteRequest: (shippingMethod: ShippingMethod) => void
}

const CALCULATION_TYPE_LABELS: Record<ShippingMethod["calculation_type"], string> = {
	fixed: "ثابت",
	weight: "بر اساس وزن",
	weight_zone: "وزن + منطقه (غیرفعال)",
}

function formatToman(amount: number): string {
	return `${amount.toLocaleString("fa-IR")} تومان`
}

// جدول ساده و بدون pagination/سوایپ موبایل (برخلاف CategoryTable) چون تعداد
// روش‌های ارسال معمولاً کمه؛ روی موبایل با overflow-x-auto اسکرول افقی می‌خورد.
export function ShippingMethodTable({ shippingMethods, onEdit, onDeleteRequest }: ShippingMethodTableProps) {
	if (shippingMethods.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-text-2">
				<Package className="h-8 w-8 opacity-50" />
				<p className="text-sm">هنوز هیچ روش ارسالی ثبت نشده.</p>
			</div>
		)
	}

	return (
		<div className="overflow-x-auto rounded-xl border border-border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>نام</TableHead>
						<TableHead>کد</TableHead>
						<TableHead>نوع محاسبه</TableHead>
						<TableHead>هزینه پایه</TableHead>
						<TableHead>ارسال رایگان</TableHead>
						<TableHead>بازه تحویل</TableHead>
						<TableHead>وضعیت</TableHead>
						<TableHead>ترتیب</TableHead>
						<TableHead className="w-24 text-left">عملیات</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{shippingMethods.map((method) => (
						<TableRow key={method.id}>
							<TableCell className="font-medium text-text-1">{method.name}</TableCell>
							<TableCell className="text-text-2" dir="ltr">
								{method.code}
							</TableCell>
							<TableCell className="text-text-2">{CALCULATION_TYPE_LABELS[method.calculation_type]}</TableCell>
							<TableCell className="text-text-2">{formatToman(method.base_cost)}</TableCell>
							<TableCell className="text-text-2">
								{method.free_shipping_enabled
									? `بالای ${formatToman(method.free_shipping_threshold ?? 0)}`
									: "—"}
							</TableCell>
							<TableCell className="text-text-2">
								{method.estimated_days_min != null && method.estimated_days_max != null
									? `${method.estimated_days_min} تا ${method.estimated_days_max} روز`
									: "—"}
							</TableCell>
							<TableCell>
								{method.is_active ? <Badge variant="success">فعال</Badge> : <Badge variant="muted">غیرفعال</Badge>}
							</TableCell>
							<TableCell className="text-text-2">{method.sort_order}</TableCell>
							<TableCell>
								<div className="flex items-center justify-end gap-1">
									<Button type="button" variant="ghost" size="icon" aria-label="ویرایش" onClick={() => onEdit(method)}>
										<Pencil className="h-4 w-4" />
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										aria-label="حذف"
										className="text-danger hover:bg-danger/10 hover:text-danger"
										onClick={() => onDeleteRequest(method)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}