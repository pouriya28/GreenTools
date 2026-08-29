export type PriceProposalStatus = "pending_review" | "approved" | "rejected" | "edited"

export interface PriceProposalProductSummary {
  id: number
  name: string
  sku: string
}

// Exact shape of ProductPriceProposalResource (backend)
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

export interface BatchReviewResult {
  message: string
}

export interface ResourceEnvelope<T> {
  data: T
}

// ---------------------------------------------------------------------------
// Exchange rate management - fully separate domain from price proposals,
// mirrors the backend's admin/exchange-rates/* routes and the dedicated
// exchange-rates.manage permission (see ExchangeRateOverrideController /
// ExchangeRateScheduleController). Never merge these back into the proposal
// types/API above - that's exactly the coupling the backend split removed.
// ---------------------------------------------------------------------------

// Matches the ExchangeRate model's `status` column values exactly.
export type ExchangeRateStatus = "pending_review" | "applied" | "rejected"

// Matches the ExchangeRate model's `source` column values exactly (see the
// exchange_rates_source_check CHECK constraint).
export type ExchangeRateSource = "navasan" | "scheduled" | "manual_admin" | "manual_fetch"

// Exact response shape of ExchangeRateOverrideController::current (200).
// Bug fix: `rate` is a decimal-cast column (`'rate' => 'decimal:4'` on the
// ExchangeRate model), so Laravel always serializes it as a STRING (e.g.
// "593000.0000"), never a JSON number, to avoid float precision loss. Convert
// with Number(...) before doing math or formatting as a price.
export interface CurrentExchangeRate {
  rate: string
  status: ExchangeRateStatus
  source: ExchangeRateSource
  fetched_at: string | null
}

// Exactly matches ManualExchangeRateOverrideRequest
export interface ManualOverridePayload {
  rate: number
  reason: string
}

// Exact response shape of ExchangeRateOverrideController::store (201)
export interface ManualOverrideResult {
  message: string
  exchange_rate_id: number
  batch_id: string
}

// Exact response shape of ExchangeRateOverrideController::fetchNow (201).
// `rate` is the same decimal-cast string as CurrentExchangeRate.rate above.
export interface FetchNowResult {
  message: string
  exchange_rate_id: number
  batch_id: string
  rate: string
}

// Exact response shape of ExchangeRateOverrideController::confirmCurrent (200)
export interface ConfirmExchangeRateResult {
  message: string
  data: {
    id: number
    rate: string
    status: ExchangeRateStatus
    source: ExchangeRateSource
    fetched_at: string | null
  }
}

export type ExchangeRateScheduleFrequency = "daily" | "weekly" | "monthly"

// Exact shape of ExchangeRateScheduleResource
export interface ExchangeRateSchedule {
  id: number
  frequency: ExchangeRateScheduleFrequency
  run_time: string // "HH:mm"
  days_of_week: number[] | null // 0=یکشنبه ... 6=شنبه (PHP Carbon dayOfWeek convention)
  days_of_month: number[] | null // 1-31
  is_active: boolean
  last_triggered_at: string | null
  created_at: string | null
}

// Matches StoreExchangeRateScheduleRequest's rules
export interface CreateSchedulePayload {
  frequency: ExchangeRateScheduleFrequency
  run_time: string
  days_of_week?: number[]
  days_of_month?: number[]
  is_active?: boolean
}

export type UpdateSchedulePayload = Partial<CreateSchedulePayload>
