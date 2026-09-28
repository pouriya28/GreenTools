import { api } from "@/shared/lib/axios"
import type { Category, CategoryPayload, ResourceEnvelope } from "../types"
import type { Ulid } from "@/shared/types/apiResponse"

const BASE = "/categories/admin"

export async function fetchCategories() {
  const { data } = await api.get<ResourceEnvelope<Category[]>>(BASE)
  return data.data
}

export async function createCategory(payload: CategoryPayload) {
  const { data } = await api.post<ResourceEnvelope<Category>>(BASE, payload)
  return data.data
}

export async function updateCategory(id: Ulid, payload: Partial<CategoryPayload>) {
  const { data } = await api.patch<ResourceEnvelope<Category>>(`${BASE}/${id}`, payload)
  return data.data
}

export async function deleteCategory(id: Ulid) {
  await api.delete(`${BASE}/${id}`)
}

export async function fetchTrashedCategories() {
  const { data } = await api.get<ResourceEnvelope<Category[]>>(`${BASE}/trash`)
  return data.data
}

export async function restoreCategory(id: Ulid) {
  const { data } = await api.post<ResourceEnvelope<Category>>(`${BASE}/${id}/restore`)
  return data.data
}

export async function forceDeleteCategory(id: Ulid) {
  await api.delete(`${BASE}/${id}/force`)
}