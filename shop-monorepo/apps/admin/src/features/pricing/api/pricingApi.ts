import { api } from "@/shared/lib/axios"
import type { PaginatedResponse } from "@/shared/types/pagination.types"
import type {
  BatchReviewResult,
  ManualOverridePayload,
  ManualOverrideResult,
  PriceProposal,
  PriceProposalFilters,
  ResourceEnvelope,
} from "../types"

// نکته امنیتی: این مسیرها روی بک‌اند با میدل‌ور
// auth:sanctum, staff.access, account.active, throttle:120,1 محافظت می‌شن؛
// override دستی علاوه‌براین throttle جدا و سخت‌گیرانه‌تری (۵ در ۶۰ دقیقه) دارد.
// این‌جا فقط پیام خطای throttle/دسترسی رو خوانا نشون می‌دیم؛ محدودیت واقعی
// همیشه سمت سرور اعمال می‌شه، نه اینجا.
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

export async function submitManualExchangeRateOverride(payload: ManualOverridePayload) {
  const { data } = await api.post<ManualOverrideResult>(`${BASE}/override`, payload)
  return data
}

// این مسیر CSV خام برمی‌گردونه (Content-Type: text/csv)، نه یک JSON envelope؛
// responseType باید "blob" باشه وگرنه axios سعی می‌کنه بدنه رو JSON.parse کنه
// و روی یک CSV واقعی خطا می‌ده.
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
