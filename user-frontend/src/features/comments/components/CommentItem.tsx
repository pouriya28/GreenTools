// src/features/comments/components/CommentItem.tsx
import { useState } from "react";
import type { Comment } from "../types/Comment";
import { isOwnComment } from "../lib/ownCommentsStorage";
import { useUpdateComment } from "../hooks/useUpdateComment";
import { useDeleteComment } from "../hooks/useDeleteComment";
import { CommentForm } from "./CommentForm";

const ROLE_BADGE_STYLES: Record<string, string> = {
  support: "bg-info/10 text-info",
  member: "bg-primary/10 text-primary",
  guest: "bg-muted/10 text-muted",
};

interface CommentItemProps {
  comment: Comment;
  productId: number;
  isMember: boolean;
  depth?: number;
}

export function CommentItem({ comment, productId, isMember, depth = 0 }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const updateComment = useUpdateComment(productId);
  const deleteComment = useDeleteComment(productId);

  const canManage = comment.is_editable && isOwnComment(comment.id);

  function handleSaveEdit() {
    updateComment.mutate(
      { id: comment.id, payload: { body: editBody, rating: comment.rating } },
      { onSuccess: () => setIsEditing(false) },
    );
  }

  return (
    <div className={depth > 0 ? "mr-6 border-r border-border pr-4" : ""} dir="rtl">
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE_STYLES[comment.author.role]}`}
          >
            {comment.author.label}
          </span>
          {comment.rating && (
            <span className="text-xs text-warning">{"★".repeat(comment.rating)}</span>
          )}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={2}
              className="resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-text"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={updateComment.isPending}
                className="rounded-lg bg-primary px-3 py-1 text-xs text-white"
              >
                ذخیره
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg border border-border px-3 py-1 text-xs text-text-secondary"
              >
                انصراف
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">{comment.body}</p>
        )}

        <div className="flex gap-3 text-xs text-muted">
          {depth === 0 && (
            <button type="button" onClick={() => setIsReplying((v) => !v)} className="hover:text-primary">
              پاسخ
            </button>
          )}
          {canManage && !isEditing && (
            <>
              <button type="button" onClick={() => setIsEditing(true)} className="hover:text-primary">
                ویرایش
              </button>
              <button
                type="button"
                onClick={() => deleteComment.mutate(comment.id)}
                className="hover:text-error"
              >
                حذف
              </button>
            </>
          )}
        </div>
      </div>

      {isReplying && (
        <div className="mt-2 mr-6">
          <CommentForm
            productId={productId}
            parentId={comment.id}
            isMember={isMember}
            showRating={false}
            onDone={() => setIsReplying(false)}
          />
        </div>
      )}

      {comment.replies?.map((reply) => (
        <div key={reply.id} className="mt-2">
          <CommentItem comment={reply} productId={productId} isMember={isMember} depth={depth + 1} />
        </div>
      ))}
    </div>
  );
}