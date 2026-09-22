// src/features/comments/components/CommentForm.tsx
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { StarRatingInput } from "./StarRatingInput";
import { useCreateComment } from "../hooks/useCreateComment";
import { ApiError } from "@/shared/error/ApiError";

interface CommentFormProps {
  productId: number;
  parentId?: number | null;
  isMember: boolean;
  showRating?: boolean;
  onDone?: () => void;
}

function buildSchema(isMember: boolean, showRating: boolean) {
  return z.object({
    body: z
      .string()
      .trim()
      .min(3, "نظر باید حداقل ۳ کاراکتر باشد")
      .max(2000, "نظر نباید بیشتر از ۲۰۰۰ کاراکتر باشد"),
    rating: showRating
      ? z
          .number({ invalid_type_error: "امتیاز را انتخاب کنید" })
          .min(1, "امتیاز را انتخاب کنید")
          .max(5)
      : z.number().nullable(),
    guest_name: isMember
      ? z.string().optional()
      : z.string().trim().min(2, "نام باید حداقل ۲ کاراکتر باشد").max(100, "نام خیلی طولانی است"),
    guest_email: isMember
      ? z.string().optional()
      : z.string().trim().email("ایمیل معتبر نیست"),
  });
}

type CommentFormValues = {
  body: string;
  rating: number | null;
  guest_name?: string;
  guest_email?: string;
};

export function CommentForm({
  productId,
  parentId = null,
  isMember,
  showRating = true,
  onDone,
}: CommentFormProps) {
  const schema = buildSchema(isMember, showRating);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CommentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { body: "", rating: null, guest_name: "", guest_email: "" },
  });

  const { mutate, isPending, error } = useCreateComment(productId);

  // Map server-side 422 validation errors onto the matching form fields.
  useEffect(() => {
    if (error instanceof ApiError && error.errors) {
      for (const [field, messages] of Object.entries(error.errors)) {
        if (field === "body" || field === "rating" || field === "guest_name" || field === "guest_email") {
          setError(field as keyof CommentFormValues, { type: "server", message: messages[0] });
        }
      }
    }
  }, [error, setError]);

  function onSubmit(values: CommentFormValues) {
    mutate(
      {
        commentable_type: "product",
        commentable_id: productId,
        parent_id: parentId,
        body: values.body,
        rating: showRating ? values.rating : null,
        ...(!isMember && { guest_name: values.guest_name, guest_email: values.guest_email }),
      },
      {
        onSuccess: () => {
          reset();
          onDone?.();
        },
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4"
      dir="rtl"
      noValidate
    >
      {!isMember && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <input
              type="text"
              placeholder="نام شما"
              {...register("guest_name")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text"
            />
            {errors.guest_name && <p className="mt-1 text-xs text-error">{errors.guest_name.message}</p>}
          </div>
          <div>
            <input
              type="email"
              placeholder="ایمیل شما"
              {...register("guest_email")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text"
            />
            {errors.guest_email && <p className="mt-1 text-xs text-error">{errors.guest_email.message}</p>}
          </div>
        </div>
      )}

      {showRating && (
        <div>
          <Controller
            name="rating"
            control={control}
            render={({ field }) => <StarRatingInput value={field.value} onChange={field.onChange} />}
          />
          {errors.rating && <p className="mt-1 text-xs text-error">{errors.rating.message}</p>}
        </div>
      )}

      <div>
        <textarea
          placeholder="نظر خود را بنویسید..."
          rows={3}
          {...register("body")}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-text"
        />
        {errors.body && <p className="mt-1 text-xs text-error">{errors.body.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {isPending ? "در حال ارسال..." : "ثبت نظر"}
      </button>
    </form>
  );
}