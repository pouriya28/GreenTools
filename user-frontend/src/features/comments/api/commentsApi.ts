import { api } from "@/lib/axios";
import type {
  Comment,
  CreateCommentPayload,
  UpdateCommentPayload,
} from "../types/Comment";

interface ApiEnvelope<T> {
  data: T;
}

export interface PaginatedComments {
  items: Comment[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

// GET /v1/comments — public، صفحه‌بندی‌شده (items + meta)
export async function getComments(
  commentableType: "product",
  commentableId: number,
  page = 1,
  perPage = 5,
): Promise<PaginatedComments> {
  const { data } = await api.get<ApiEnvelope<PaginatedComments>>(
    "/v1/comments",
    {
      params: {
        commentable_type: commentableType,
        commentable_id: commentableId,
        page,
        per_page: perPage,
      },
    },
  );
  return data.data;
}

// POST /v1/comments — عضو (با Bearer token خودکار از اینترسپتور) یا مهمان
export async function createComment(payload: CreateCommentPayload): Promise<Comment> {
  const { data } = await api.post<ApiEnvelope<Comment>>("/v1/comments", payload);
  return data.data;
}

// PATCH /v1/comments/{id}
export async function updateComment(id: number, payload: UpdateCommentPayload): Promise<Comment> {
  const { data } = await api.patch<ApiEnvelope<Comment>>(`/v1/comments/${id}`, payload);
  return data.data;
}

// DELETE /v1/comments/{id}
export async function deleteComment(id: number): Promise<void> {
  await api.delete(`/v1/comments/${id}`);
}