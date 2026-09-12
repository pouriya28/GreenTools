// src/features/comments/types/CommentAdmin.ts
export type CommentAdminStatus = "pending" | "approved" | "rejected";

export interface CommentAdminItem {
  id: number;
  commentable_type: string;
  commentable_id: number;
  parent_id: number | null;
  parent?: { id: number; body: string } | null;
  body: string;
  rating: number | null;
  status: CommentAdminStatus;
  member?: { id: number; name: string; email: string } | null;
  guest_name: string | null;
  guest_email: string | null;
  created_at: string;
}

export interface CommentAdminListMeta {
  current_page: number;
  last_page: number;
  total: number;
}