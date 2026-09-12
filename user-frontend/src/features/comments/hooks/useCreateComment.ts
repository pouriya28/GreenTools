// src/features/comments/hooks/useCreateComment.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment } from "../api/commentsApi";
import type { CreateCommentPayload } from "../types/Comment";
import { rememberOwnComment } from "../lib/ownCommentsStorage";

export function useCreateComment(productId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCommentPayload) => createComment(payload),
    onSuccess: (comment) => {
      rememberOwnComment(comment.id);
      queryClient.invalidateQueries({ queryKey: ["comments", "product", productId] });
    },
  });
}