import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import {
  deleteProductImage,
  deleteProductVideo,
  setPrimaryProductImage,
  storeProductImages,
  storeProductVideo,
  type StoreProductVideoPayload,
} from "../api/productsApi"

function invalidateProductDetail(queryClient: QueryClient, productId: number) {
  queryClient.invalidateQueries({ queryKey: ["products", "detail", productId] })
}

export function useUploadProductImages(productId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ files, altTexts }: { files: File[]; altTexts?: string[] }) =>
      storeProductImages(productId, files, altTexts ?? []),
    onSuccess: () => invalidateProductDetail(queryClient, productId),
  })
}

export function useSetPrimaryProductImage(productId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (imageId: number) => setPrimaryProductImage(productId, imageId),
    onSuccess: () => invalidateProductDetail(queryClient, productId),
  })
}

export function useDeleteProductImage(productId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (imageId: number) => deleteProductImage(productId, imageId),
    onSuccess: () => invalidateProductDetail(queryClient, productId),
  })
}

export function useUploadProductVideo(productId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: StoreProductVideoPayload) => storeProductVideo(productId, payload),
    onSuccess: () => invalidateProductDetail(queryClient, productId),
  })
}

export function useDeleteProductVideo(productId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (videoId: number) => deleteProductVideo(productId, videoId),
    onSuccess: () => invalidateProductDetail(queryClient, productId),
  })
}
