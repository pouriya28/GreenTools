import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createCategory, updateCategory, deleteCategory, restoreCategory, forceDeleteCategory } from "../api/categoriesApi"
import type { CategoryPayload } from "../types"
import { categoriesQueryKey } from "./useCategories"
import { trashedCategoriesQueryKey } from "./useTrashedCategories"

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CategoryPayload) => createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CategoryPayload> }) =>
      updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey })
      // با حذف (سافت) یه دسته، تازه وارد سطل‌زباله میشه؛ اگه یوزر همون لحظه
      // صفحه‌ی سطل رو باز داشته باشه، این invalidate باعث میشه به‌روز شه.
      queryClient.invalidateQueries({ queryKey: trashedCategoriesQueryKey })
    },
  })
}

export function useRestoreCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => restoreCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey })
      queryClient.invalidateQueries({ queryKey: trashedCategoriesQueryKey })
    },
  })
}

export function useForceDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => forceDeleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trashedCategoriesQueryKey })
    },
  })
}