export type ShippingCalculationType = "fixed" | "weight" | "weight_zone"

export interface ShippingMethod {
    id: number
    name: string
    code: string
    calculation_type: ShippingCalculationType
    free_shipping_enabled: boolean
    free_shipping_threshold: number | null
    estimated_days_min: number | null
    estimated_days_max: number | null
}

export interface ShippingQuote {
    shipping_method_id: number
    method_name: string
    calculation_type: ShippingCalculationType
    cost: number
    is_free_shipping: boolean
    estimated_days_min: number | null
    estimated_days_max: number | null
}