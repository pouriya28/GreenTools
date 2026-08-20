export type PriceProposalStatus = "pending_review" | "approved" | "rejected" | "edited"

export interface PriceProposalProductSummary {
  id: number
  name: string
  sku: string
}

// خروجی دقیق ProductPriceProposalResource (بک‌اند)
export interface PriceProposal {
  id: number
  batch_id: string
  product: PriceProposalProductSummary
  old_price_toman: number
  new_price_toman: number
  edited_price_toman: number | null
  effective_price_toman: number
  status: PriceProposalStatus
  reviewed_by: number | null
  reviewed_at: string | null
  created_at: string | null
}

export interface PriceProposalFilters {
  batch_id?: string
  page?: number
  per_page?: number
}

// دقیقاً منطبق با ManualExchangeRateOverrideRequest
export interface ManualOverridePayload {
  rate: number
  reason: string
}

// خروجی دقیق ExchangeRateOverrideController::store (201)
export interface ManualOverrideResult {
  message: string
  exchange_rate_id: number
  batch_id: string
}

export interface BatchReviewResult {
  message: string
}

export interface ResourceEnvelope<T> {
  data: T
}
