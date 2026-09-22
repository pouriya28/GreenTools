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
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProductPayload> }) =>
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
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      invalidateProductLists(queryClient)
      invalidateTrash(queryClient)
    },
  })
}

export function useToggleFeaturedProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => toggleFeaturedProduct(id),
    onSuccess: () => invalidateProductLists(queryClient),
  })
}

export function useRestoreProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => restoreProduct(id),
    onSuccess: () => {
      invalidateProductLists(queryClient)
      invalidateTrash(queryClient)
    },
  })
}

export function useForceDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => forceDeleteProduct(id),
    onSuccess: () => invalidateTrash(queryClient),
  })
}