// src/features/comments/hooks/useDeleteComment.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteComment } from "../api/commentsApi";

export function useDeleteComment(productId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", "product", productId] });
    },
  });
}