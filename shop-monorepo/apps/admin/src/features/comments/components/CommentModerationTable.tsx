// src/features/comments/components/CommentModerationTable.tsx
import { Fragment, useState } from "react";
import { Check, MessageSquareReply, Trash2, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CommentAdminItem } from "../types/CommentAdmin";
import { useApproveComment, useRejectComment, useDeleteCommentAsStaff } from "../hooks/useModerateComment";
import { CommentReplyForm } from "./CommentReplyForm";

const STATUS_BADGE: Record<CommentAdminItem["status"], { label: string; variant: "success" | "warning" | "muted" }> = {
  pending: { label: "در انتظار", variant: "warning" },
  approved: { label: "تاییدشده", variant: "success" },
  rejected: { label: "ردشده", variant: "muted" },
};

interface CommentModerationTableProps {
  comments: CommentAdminItem[];
}

export function CommentModerationTable({ comments }: CommentModerationTableProps) {
  const [replyOpenId, setReplyOpenId] = useState<number | null>(null);
  const approve = useApproveComment();
  const reject = useRejectComment();
  const remove = useDeleteCommentAsStaff();

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-text-2">
        <p className="text-sm">هیچ نظر در انتظار بررسی‌ای وجود ندارد.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>نویسنده</TableHead>
            <TableHead>متن</TableHead>
            <TableHead>امتیاز</TableHead>
            <TableHead>وضعیت</TableHead>
            <TableHead className="w-44 text-left">عملیات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comments.map((comment) => {
            const badge = STATUS_BADGE[comment.status];
            const authorLabel = comment.member?.name ?? comment.guest_name ?? "مهمان";
            const authorContact = comment.member?.email ?? comment.guest_email;

            return (
              <Fragment key={comment.id}>
                <TableRow>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-text-1">{authorLabel}</span>
                      {authorContact && <span className="text-xs text-text-3">{authorContact}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-sm">
                    {comment.parent && (
                      <p className="mb-1 line-clamp-1 text-xs text-text-3">پاسخ به: {comment.parent.body}</p>
                    )}
                    <p className="line-clamp-2 text-sm text-text-2">{comment.body}</p>
                  </TableCell>
                  <TableCell className="text-text-2">{comment.rating ? "★".repeat(comment.rating) : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="تایید"
                        className="text-success hover:bg-success/10 hover:text-success"
                        onClick={() => approve.mutate(comment.id)}
                        disabled={approve.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="رد"
                        className="text-danger hover:bg-danger/10 hover:text-danger"
                        onClick={() => reject.mutate(comment.id)}
                        disabled={reject.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="پاسخ"
                        onClick={() => setReplyOpenId((current) => (current === comment.id ? null : comment.id))}
                      >
                        <MessageSquareReply className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="حذف"
                        className="text-danger hover:bg-danger/10 hover:text-danger"
                        onClick={() => remove.mutate(comment.id)}
                        disabled={remove.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {replyOpenId === comment.id && (
                  <TableRow>
                    <TableCell colSpan={5} className="bg-bg-2">
                      <CommentReplyForm
                        commentableType={comment.commentable_type}
                        commentableId={comment.commentable_id}
                        parentId={comment.id}
                        onDone={() => setReplyOpenId(null)}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}