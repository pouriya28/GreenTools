// src/features/comments/pages/CommentModerationPage.tsx
import { useState } from "react";
import { usePendingComments } from "../hooks/usePendingComments";
import { CommentModerationTable } from "../components/CommentModerationTable";
import { Button } from "@/components/ui/button";

export function CommentModerationPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = usePendingComments(page);

  return (
    <div className="flex flex-col gap-4 p-4" dir="rtl">
      <h1 className="text-lg font-bold text-text-1">مدیریت نظرات</h1>

      {isLoading && <p className="text-sm text-text-2">در حال بارگذاری...</p>}
      {isError && <p className="text-sm text-danger">خطا در دریافت نظرات.</p>}

      {data && (
        <>
          <CommentModerationTable comments={data.items} />
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-3">
              صفحه {data.meta.current_page} از {data.meta.last_page} (مجموع {data.meta.total})
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={data.meta.current_page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                قبلی
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={data.meta.current_page >= data.meta.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                بعدی
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}