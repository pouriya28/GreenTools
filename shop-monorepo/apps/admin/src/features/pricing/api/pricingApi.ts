import { api } from "@/shared/lib/axios"
import type { PaginatedResponse } from "@/shared/types/pagination.types"
import type { BatchReviewResult, PriceProposal, PriceProposalFilters, ResourceEnvelope } from "../types"

// Security note: these routes are protected on the backend by the
// auth:sanctum, staff.access, account.active, throttle:120,1 middleware, and
// require the `prices.review` permission (see ProductPriceProposalPolicy).
// Exchange-rate management (manual entry, on-demand fetch, confirm,
// scheduling) now lives entirely in "./exchangeRateApi" against the separate
// admin/exchange-rates/* routes and the exchange-rates.manage permission - do
// not re-add those calls here, it would drift from the backend split again.
const BASE = "/admin/prices"

export async function fetchPriceProposals(filters: PriceProposalFilters = {}) {
  const { data } = await api.get<PaginatedResponse<PriceProposal>>(`${BASE}/proposals`, {
    params: {
      batch_id: filters.batch_id || undefined,
      page: filters.page || 1,
      per_page: filters.per_page || 50,
    },
  })
  return data
}

export async function updatePriceProposal(proposalId: number, editedPriceToman: number) {
  const { data } = await api.patch<ResourceEnvelope<PriceProposal>>(`${BASE}/proposals/${proposalId}`, {
    edited_price_toman: editedPriceToman,
  })
  return data.data
}

export async function approvePriceProposal(proposalId: number) {
  const { data } = await api.post<ResourceEnvelope<PriceProposal>>(`${BASE}/proposals/${proposalId}/approve`)
  return data.data
}

export async function rejectPriceProposal(proposalId: number) {
  const { data } = await api.post<ResourceEnvelope<PriceProposal>>(`${BASE}/proposals/${proposalId}/reject`)
  return data.data
}

export async function approveProposalBatch(batchId: string) {
  const { data } = await api.post<BatchReviewResult>(`${BASE}/proposals/batch/${batchId}/approve`)
  return data
}

export async function rejectProposalBatch(batchId: string) {
  const { data } = await api.post<BatchReviewResult>(`${BASE}/proposals/batch/${batchId}/reject`)
  return data
}

// This route returns raw CSV (Content-Type: text/csv), not a JSON envelope;
// responseType must be "blob" or axios will try to JSON.parse the body and
// fail on real CSV content.
export async function exportPriceProposalsCsv(batchId: string) {
  const response = await api.get(`${BASE}/proposals/${batchId}/export`, {
    responseType: "blob",
  })
  return response.data as Blob
}

export function downloadCsvBlob(blob: Blob, batchId: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `price-proposals-${batchId}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
