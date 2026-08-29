import { api } from "@/shared/lib/axios"
import type {
  ConfirmExchangeRateResult,
  CreateSchedulePayload,
  CurrentExchangeRate,
  ExchangeRateSchedule,
  FetchNowResult,
  ManualOverridePayload,
  ManualOverrideResult,
  ResourceEnvelope,
  UpdateSchedulePayload,
} from "../types"

// Security note: exchange-rate management (manual entry, on-demand fetch,
// confirm, scheduling) is a fully separate domain from price-proposal review
// on the backend - separate routes (admin/exchange-rates/*) and a separate
// `exchange-rates.manage` permission (see ExchangeRateOverrideController /
// ExchangeRateScheduleController), distinct from `prices.review` used by
// pricingApi.ts. Do not merge these calls back into pricingApi.ts - that is
// exactly the coupling the backend split removed.
const BASE = "/admin/exchange-rates"

// GET /admin/exchange-rates/current - latest non-rejected ExchangeRate, used
// to display the current rate and to pre-fill the manual override form.
export async function fetchCurrentExchangeRate() {
  const { data } = await api.get<ResourceEnvelope<CurrentExchangeRate | null>>(`${BASE}/current`)
  return data.data
}

// POST /admin/exchange-rates/override - server-side throttle: 5 per 60
// minutes. Never applies the rate directly; creates a pending_review
// ExchangeRate + a new price-proposal batch.
export async function submitManualExchangeRateOverride(payload: ManualOverridePayload) {
  const { data } = await api.post<ManualOverrideResult>(`${BASE}/override`, payload)
  return data
}

// POST /admin/exchange-rates/fetch-now - server-side throttle: 10 per 60
// minutes. Fetches a live rate from the Navasan provider (validated
// server-side against the sane min/max range) and, like the manual override,
// only creates a pending_review ExchangeRate + proposal batch.
export async function fetchNowExchangeRate() {
  const { data } = await api.post<FetchNowResult>(`${BASE}/fetch-now`)
  return data
}

// POST /admin/exchange-rates/confirm - marks the latest non-rejected
// ExchangeRate as applied directly, independent of product price-proposal
// review. Requires exchange-rates.manage (not prices.review).
export async function confirmCurrentExchangeRate() {
  const { data } = await api.post<ConfirmExchangeRateResult>(`${BASE}/confirm`)
  return data
}

export async function fetchExchangeRateSchedules() {
  const { data } = await api.get<ResourceEnvelope<ExchangeRateSchedule[]>>(`${BASE}/schedules`)
  return data.data
}

export async function createExchangeRateSchedule(payload: CreateSchedulePayload) {
  const { data } = await api.post<ResourceEnvelope<ExchangeRateSchedule>>(`${BASE}/schedules`, payload)
  return data.data
}

export async function updateExchangeRateSchedule(scheduleId: number, payload: UpdateSchedulePayload) {
  const { data } = await api.patch<ResourceEnvelope<ExchangeRateSchedule>>(
    `${BASE}/schedules/${scheduleId}`,
    payload,
  )
  return data.data
}

export async function deleteExchangeRateSchedule(scheduleId: number) {
  const { data } = await api.delete<{ message: string }>(`${BASE}/schedules/${scheduleId}`)
  return data
}
