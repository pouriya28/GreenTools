// src/features/comments/hooks/usePendingComments.ts
import { useQuery } from "@tanstack/react-query";
import { getPendingComments } from "../api/commentsAdminApi";

export function usePendingComments(page: number) {
  return useQuery({
    queryKey: ["admin", "comments", "pending", page],
    queryFn: () => getPendingComments(page),
    placeholderData: (prev) => prev,
  });
}