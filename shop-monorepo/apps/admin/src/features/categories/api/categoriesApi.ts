import { api } from "@/shared/lib/axios"
import type { Category, CategoryPayload, ResourceEnvelope } from "../types"

const BASE = "/categories/admin"

export async function fetchCategories() {
  const { data } = await api.get<ResourceEnvelope<Category[]>>(BASE)
  return data.data
}

export async function createCategory(payload: CategoryPayload) {
  const { data } = await api.post<ResourceEnvelope<Category>>(BASE, payload)
  return data.data
}

export async function updateCategory(id: number, payload: Partial<CategoryPayload>) {
  const { data } = await api.patch<ResourceEnvelope<Category>>(`${BASE}/${id}`, payload)
  return data.data
}

export async function deleteCategory(id: number) {
  await api.delete(`${BASE}/${id}`)
}

export async function fetchTrashedCategories() {
  const { data } = await api.get<ResourceEnvelope<Category[]>>(`${BASE}/trash`)
  return data.data
}

export async function restoreCategory(id: number) {
  const { data } = await api.post<ResourceEnvelope<Category>>(`${BASE}/${id}/restore`)
  return data.data
}

export async function forceDeleteCategory(id: number) {
  await api.delete(`${BASE}/${id}/force`)
}