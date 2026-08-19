import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleFeaturedProduct,
  restoreProduct,
  forceDeleteProduct,
} from "../api/productsApi"
import type { ProductPayload } from "../types"

// چون کلید لیست شامل فیلترهاست (["products", filters])، به‌جای invalidate
// دقیق، هر query ای که با "products" شروع بشه (بجز trash و detail) رو
// invalidate می‌کنیم.
function invalidateProductLists(queryClient: QueryClient) {
  queryClient.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === "products" &&
      query.queryKey[1] !== "trash" &&
      query.queryKey[1] !== "detail",
  })
}

function invalidateTrash(queryClient: QueryClient) {
  queryClient.invalidateQueries({
    predicate: (query) => query.queryKey[0] === "products" && query.queryKey[1] === "trash",
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProductPayload) => createProduct(payload),
    onSuccess: () => invalidateProductLists(queryClient),
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ProductPayload> }) =>
      updateProduct(id, payload),
    onSuccess: (_data, variables) => {
      invalidateProductLists(queryClient)
      queryClient.invalidateQueries({ queryKey: ["products", "detail", variables.id] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      invalidateProductLists(queryClient)
      invalidateTrash(queryClient)
    },
  })
}

export function useToggleFeaturedProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => toggleFeaturedProduct(id),
    onSuccess: () => invalidateProductLists(queryClient),
  })
}

export function useRestoreProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => restoreProduct(id),
    onSuccess: () => {
      invalidateProductLists(queryClient)
      invalidateTrash(queryClient)
    },
  })
}

export function useForceDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => forceDeleteProduct(id),
    onSuccess: () => invalidateTrash(queryClient),
  })
}