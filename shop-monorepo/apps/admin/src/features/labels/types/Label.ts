export type PaperSize = "a4" | "a5"
export type LabelSize = "10x15" | "10x10"

export type ShippingLabelSender = {
	sender_name: string
	sender_phone: string
	province_name: string
	city_name: string
	district: string | null
	address_line: string
	plaque: string | null
	unit: string | null
	postal_code: string
}

export type ShippingLabelItem = {
	order_id: number
	recipient_name: string | null
	recipient_phone: string | null
	province_name: string | null
	city_name: string | null
	district: string | null
	address_line: string | null
	plaque: string | null
	unit: string | null
	postal_code: string | null
}

export type ShippingLabelLayout = {
	paper_size: PaperSize
	label_size: LabelSize
	label_width_mm: number
	label_height_mm: number
	paper_width_mm: number
	paper_height_mm: number
	columns: number
	rows: number
}

export type ShippingLabelSheet = {
	sender: ShippingLabelSender
	labels: ShippingLabelItem[]
	layout: ShippingLabelLayout
}

export type GenerateShippingLabelsPayload = {
	order_ids: number[]
	status?: string
	sender_address_id: number
	paper_size: PaperSize
	label_size: LabelSize
	copies_per_order: number
}