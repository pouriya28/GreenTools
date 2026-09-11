import { useEffect, useState, type FormEvent } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useShippingMethodMutations } from "../hooks/useShippingMethodMutations"
import { ApiError } from "@/shared/lib/apiError"
import type { ShippingMethod, ShippingMethodFormValues } from "../types/ShippingMethod"

interface ShippingMethodFormDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	shippingMethod: ShippingMethod | null
}

const EMPTY_FORM: ShippingMethodFormValues = {
	name: "",
	code: "",
	base_cost: 0,
	calculation_type: "fixed",
	cost_per_kg: null,
	min_weight_grams: null,
	max_weight_grams: null,
	free_shipping_enabled: false,
	free_shipping_threshold: null,
	estimated_days_min: null,
	estimated_days_max: null,
	is_active: true,
	sort_order: 0,
}

function toFormValues(method: ShippingMethod): ShippingMethodFormValues {
	return {
		name: method.name,
		code: method.code,
		base_cost: method.base_cost,
		calculation_type: method.calculation_type === "weight_zone" ? "weight" : method.calculation_type,
		cost_per_kg: method.cost_per_kg,
		min_weight_grams: method.min_weight_grams,
		max_weight_grams: method.max_weight_grams,
		free_shipping_enabled: method.free_shipping_enabled,
		free_shipping_threshold: method.free_shipping_threshold,
		estimated_days_min: method.estimated_days_min,
		estimated_days_max: method.estimated_days_max,
		is_active: method.is_active,
		sort_order: method.sort_order,
	}
}

export function ShippingMethodFormDialog({ open, onOpenChange, shippingMethod }: ShippingMethodFormDialogProps) {
	const isEditing = shippingMethod !== null
	const { create, update } = useShippingMethodMutations()
	const [form, setForm] = useState<ShippingMethodFormValues>(EMPTY_FORM)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	useEffect(() => {
		if (open) {
			setForm(shippingMethod ? toFormValues(shippingMethod) : EMPTY_FORM)
			setErrorMessage(null)
		}
	}, [open, shippingMethod])

	const isBusy = create.isPending || update.isPending
	const requiresCostPerKg = form.calculation_type === "weight"

	function patch(values: Partial<ShippingMethodFormValues>) {
		setForm((prev) => ({ ...prev, ...values }))
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault()
		setErrorMessage(null)
		try {
			if (isEditing && shippingMethod) {
				await update.mutateAsync({ id: shippingMethod.id, values: form })
			} else {
				await create.mutateAsync(form)
			}
			onOpenChange(false)
		} catch (err) {
			setErrorMessage(err instanceof ApiError ? err.message : "ذخیره‌سازی با خطا مواجه شد.")
		}
	}

	return (
		<Dialog open={open} onOpenChange={(next) => !isBusy && onOpenChange(next)}>
			<DialogContent dir="rtl" className="max-w-lg">
				<DialogHeader>
					<DialogTitle>{isEditing ? "ویرایش روش ارسال" : "افزودن روش ارسال"}</DialogTitle>
					<DialogDescription>تنظیمات هزینه و شرایط این روش ارسال را مشخص کنید.</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-3">
						<div className="col-span-2 flex flex-col gap-1.5">
							<label className="text-sm text-text-2">نام</label>
							<Input value={form.name} onChange={(e) => patch({ name: e.target.value })} required maxLength={150} />
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-sm text-text-2">کد (انگلیسی، یکتا)</label>
							<Input
								value={form.code}
								onChange={(e) => patch({ code: e.target.value })}
								required
								maxLength={32}
								dir="ltr"
								placeholder="express-tehran"
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-sm text-text-2">نوع محاسبه</label>
							<select
								value={form.calculation_type}
								onChange={(e) =>
									patch({ calculation_type: e.target.value as ShippingMethodFormValues["calculation_type"] })
								}
								className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
							>
								<option value="fixed">ثابت</option>
								<option value="weight">بر اساس وزن</option>
							</select>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-sm text-text-2">هزینه پایه (تومان)</label>
							<Input
								type="number"
								min={0}
								value={form.base_cost}
								onChange={(e) => patch({ base_cost: Number(e.target.value) })}
								required
							/>
						</div>

						{requiresCostPerKg && (
							<>
								<div className="flex flex-col gap-1.5">
									<label className="text-sm text-text-2">هزینه هر کیلوگرم (تومان)</label>
									<Input
										type="number"
										min={0}
										value={form.cost_per_kg ?? ""}
										onChange={(e) => patch({ cost_per_kg: e.target.value ? Number(e.target.value) : null })}
										required
									/>
								</div>
								<div className="flex flex-col gap-1.5">
									<label className="text-sm text-text-2">حداقل وزن (گرم)</label>
									<Input
										type="number"
										min={0}
										value={form.min_weight_grams ?? ""}
										onChange={(e) => patch({ min_weight_grams: e.target.value ? Number(e.target.value) : null })}
									/>
								</div>
								<div className="flex flex-col gap-1.5">
									<label className="text-sm text-text-2">حداکثر وزن (گرم)</label>
									<Input
										type="number"
										min={0}
										value={form.max_weight_grams ?? ""}
										onChange={(e) => patch({ max_weight_grams: e.target.value ? Number(e.target.value) : null })}
									/>
								</div>
							</>
						)}

						<div className="flex flex-col gap-1.5">
							<label className="text-sm text-text-2">حداقل روز تحویل</label>
							<Input
								type="number"
								min={0}
								max={60}
								value={form.estimated_days_min ?? ""}
								onChange={(e) => patch({ estimated_days_min: e.target.value ? Number(e.target.value) : null })}
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-sm text-text-2">حداکثر روز تحویل</label>
							<Input
								type="number"
								min={0}
								max={60}
								value={form.estimated_days_max ?? ""}
								onChange={(e) => patch({ estimated_days_max: e.target.value ? Number(e.target.value) : null })}
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-sm text-text-2">ترتیب نمایش</label>
							<Input
								type="number"
								min={0}
								value={form.sort_order ?? 0}
								onChange={(e) => patch({ sort_order: Number(e.target.value) })}
							/>
						</div>

						<div className="col-span-2 flex items-center justify-between rounded-md border border-border px-3 py-2">
							<label className="text-sm text-text-2">ارسال رایگان مشروط</label>
							<Switch
								checked={form.free_shipping_enabled}
								onCheckedChange={(checked) =>
									patch({
										free_shipping_enabled: checked,
										free_shipping_threshold: checked ? form.free_shipping_threshold : null,
									})
								}
							/>
						</div>

						{form.free_shipping_enabled && (
							<div className="col-span-2 flex flex-col gap-1.5">
								<label className="text-sm text-text-2">حداقل مبلغ سفارش برای ارسال رایگان (تومان)</label>
								<Input
									type="number"
									min={1}
									value={form.free_shipping_threshold ?? ""}
									onChange={(e) =>
										patch({ free_shipping_threshold: e.target.value ? Number(e.target.value) : null })
									}
									required
								/>
							</div>
						)}

						<div className="col-span-2 flex items-center justify-between rounded-md border border-border px-3 py-2">
							<label className="text-sm text-text-2">فعال</label>
							<Switch checked={form.is_active} onCheckedChange={(checked) => patch({ is_active: checked })} />
						</div>
					</div>

					{errorMessage && (
						<div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
							<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
							<span>{errorMessage}</span>
						</div>
					)}

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>
							انصراف
						</Button>
						<Button type="submit" disabled={isBusy}>
							{isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
							{isEditing ? "ذخیره تغییرات" : "افزودن"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}