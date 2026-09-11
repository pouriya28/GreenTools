export type ShippingCalculationType = "fixed" | "weight" | "weight_zone"

export interface ShippingMethod {
	id: number
	name: string
	code: string
	base_cost: number
	calculation_type: ShippingCalculationType
	cost_per_kg: number | null
	min_weight_grams: number | null
	max_weight_grams: number | null
	free_shipping_enabled: boolean
	free_shipping_threshold: number | null
	estimated_days_min: number | null
	estimated_days_max: number | null
	is_active: boolean
	sort_order: number
	created_at: string
	updated_at: string
}

// weight_zone عمداً از فرم حذف شده (فاز ۳، هنوز در ManualShippingCalculator
// پیاده نشده)؛ اگه بک‌اند برایش هم اجازه بدهد، اینجا و در select دیالوگ اضافه‌اش کن.
export interface ShippingMethodFormValues {
	name: string
	code: string
	base_cost: number
	calculation_type: "fixed" | "weight"
	cost_per_kg: number | null
	min_weight_grams: number | null
	max_weight_grams: number | null
	free_shipping_enabled: boolean
	free_shipping_threshold: number | null
	estimated_days_min: number | null
	estimated_days_max: number | null
	is_active: boolean
	sort_order: number | null
}