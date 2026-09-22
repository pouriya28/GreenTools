// src/features/comments/types/Comment.ts

export type CommentAuthorRole = "guest" | "member" | "support";

export interface CommentAuthor {
  role: CommentAuthorRole;
  label: string; // e.g. "کاربر تازه‌وارد" | "پشتیبان" | "مهمان"
}

export type CommentStatus = "pending" | "approved" | "rejected";

export interface Comment {
  id: number;
  parent_id: number | null;
  body: string;
  rating: number | null;
  status: CommentStatus;
  author: CommentAuthor;
  is_editable: boolean; // UI hint only — real authorization happens server-side
  created_at: string;
  replies?: Comment[];
}

export interface CreateCommentPayload {
  commentable_type: "product";
  commentable_id: number;
  parent_id?: number | null;
  body: string;
  rating?: number | null;
  guest_name?: string;
  guest_email?: string;
}

export interface UpdateCommentPayload {
  body: string;
  rating?: number | null;
}