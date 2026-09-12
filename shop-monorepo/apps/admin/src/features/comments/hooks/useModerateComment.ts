// src/features/comments/hooks/useModerateComment.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveComment, rejectComment, deleteCommentAsStaff, replyToComment } from "../api/commentsAdminApi";

function useInvalidatePending() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["admin", "comments", "pending"] });
}

export function useApproveComment() {
  const invalidate = useInvalidatePending();
  return useMutation({ mutationFn: approveComment, onSuccess: invalidate });
}

export function useRejectComment() {
  const invalidate = useInvalidatePending();
  return useMutation({ mutationFn: rejectComment, onSuccess: invalidate });
}

export function useDeleteCommentAsStaff() {
  const invalidate = useInvalidatePending();
  return useMutation({ mutationFn: deleteCommentAsStaff, onSuccess: invalidate });
}

export function useReplyToComment() {
  const invalidate = useInvalidatePending();
  return useMutation({ mutationFn: replyToComment, onSuccess: invalidate });
}