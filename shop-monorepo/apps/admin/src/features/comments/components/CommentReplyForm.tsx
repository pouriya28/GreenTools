// src/features/comments/components/CommentReplyForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useReplyToComment } from "../hooks/useModerateComment";

const replySchema = z.object({
  body: z
    .string()
    .trim()
    .min(3, "پاسخ باید حداقل ۳ کاراکتر باشد")
    .max(2000, "پاسخ نباید بیشتر از ۲۰۰۰ کاراکتر باشد"),
});

type ReplyFormValues = z.infer<typeof replySchema>;

interface CommentReplyFormProps {
  commentableType: string;
  commentableId: number;
  parentId: number;
  onDone: () => void;
}

export function CommentReplyForm({ commentableType, commentableId, parentId, onDone }: CommentReplyFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema),
    defaultValues: { body: "" },
  });
  const { mutate, isPending, error } = useReplyToComment();

  function onSubmit(values: ReplyFormValues) {
    mutate(
      { commentable_type: commentableType, commentable_id: commentableId, parent_id: parentId, body: values.body },
      { onSuccess: () => { reset(); onDone(); } },
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 p-2" dir="rtl" noValidate>
      <textarea
        {...register("body")}
        rows={2}
        placeholder="پاسخ پشتیبانی..."
        className="w-full resize-none rounded-lg border border-border bg-bg-1 px-3 py-2 text-sm text-text-1"
      />
      {errors.body && <p className="text-xs text-danger">{errors.body.message}</p>}
      {error && <p className="text-xs text-danger">ارسال پاسخ با خطا مواجه شد.</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "در حال ارسال..." : "ارسال پاسخ"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          انصراف
        </Button>
      </div>
    </form>
  );
}