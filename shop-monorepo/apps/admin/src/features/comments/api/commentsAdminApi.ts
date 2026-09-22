// src/features/comments/api/commentsAdminApi.ts
import { api } from "@/shared/lib/axios"; // ⚠️ مسیر رو حدس زدم — پایین توضیح دادم
import type { CommentAdminItem, CommentAdminListMeta } from "../types/CommentAdmin";

interface ApiEnvelope<T> {
  data: T;
}

interface PendingCommentsResponse {
  items: CommentAdminItem[];
  meta: CommentAdminListMeta;
}

export async function getPendingComments(page = 1): Promise<PendingCommentsResponse> {
  const { data } = await api.get<ApiEnvelope<PendingCommentsResponse>>("/admin/comments", {
    params: { page },
  });
  return data.data;
}

export async function approveComment(id: number): Promise<CommentAdminItem> {
  const { data } = await api.patch<ApiEnvelope<CommentAdminItem>>(`/admin/comments/${id}/approve`);
  return data.data;
}

export async function rejectComment(id: number): Promise<CommentAdminItem> {
  const { data } = await api.patch<ApiEnvelope<CommentAdminItem>>(`/admin/comments/${id}/reject`);
  return data.data;
}

export async function deleteCommentAsStaff(id: number): Promise<void> {
  await api.delete(`/admin/comments/${id}`);
}

// پاسخ پشتیبان از همون endpoint عمومی استفاده می‌کنه — نقش پشتیبان خودکار
// روی سرور تشخیص داده می‌شه، مسیر جدایی لازم نیست.
export async function replyToComment(payload: {
  commentable_type: string;
  commentable_id: number;
  parent_id: number;
  body: string;
}): Promise<CommentAdminItem> {
  const { data } = await api.post<ApiEnvelope<CommentAdminItem>>("/comments", payload);
  return data.data;
}