// src/features/comments/components/StarRatingInput.tsx
interface StarRatingInputProps {
  value: number | null;
  onChange: (value: number) => void;
}

export function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  return (
    <div className="flex flex-row-reverse justify-end gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-xl transition-colors ${
            value && star <= value ? "text-warning" : "text-muted"
          }`}
          aria-label={`امتیاز ${star} از ۵`}
        >
          ★
        </button>
      ))}
    </div>
  );
}