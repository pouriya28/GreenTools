import { useState } from "react";
import { useComments } from "../hooks/useComments";
import { CommentItem } from "./CommentItem";
import { CommentForm } from "./CommentForm";
import { useAuthStore } from "@/store/authStore";

interface CommentsSectionProps {
  productId: number;
}

export function CommentsSection({ productId }: CommentsSectionProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useComments(productId);
  const isMember = useAuthStore((state) => state.isAuthenticated);

  const comments = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[0]?.meta.total ?? 0;

  return (
    <section className="flex flex-col gap-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text">
          نظرات کاربران
          {total > 0 && <span className="mr-1 text-sm font-normal text-muted">({total})</span>}
        </h2>
        {!isFormOpen && (
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            ثبت نظر جدید
          </button>
        )}
      </div>

      {isFormOpen && (
        <CommentForm productId={productId} isMember={isMember} onDone={() => setIsFormOpen(false)} />
      )}

      {isLoading && <p className="text-sm text-muted">در حال بارگذاری نظرات...</p>}
      {isError && <p className="text-sm text-error">خطا در دریافت نظرات.</p>}

      {!isLoading && !isError && comments.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface py-10 text-center">
          <p className="text-sm text-muted">هنوز نظری ثبت نشده. اولین نفر باشید!</p>
          {!isFormOpen && (
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              ثبت نظر
            </button>
          )}
        </div>
      )}

      {comments.length > 0 && (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} productId={productId} isMember={isMember} />
          ))}
        </div>
      )}

      {hasNextPage && (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mx-auto rounded-lg border border-border px-5 py-2 text-sm font-medium text-text transition-colors hover:bg-surface disabled:opacity-60"
        >
          {isFetchingNextPage ? "در حال بارگذاری..." : "نمایش بیشتر"}
        </button>
      )}
    </section>
  );
}