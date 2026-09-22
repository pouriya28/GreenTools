// src/features/comments/hooks/useUpdateComment.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateComment } from "../api/commentsApi";
import type { UpdateCommentPayload } from "../types/Comment";

export function useUpdateComment(productId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCommentPayload }) =>
      updateComment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", "product", productId] });
    },
  });
}