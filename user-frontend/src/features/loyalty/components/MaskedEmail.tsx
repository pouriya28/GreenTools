import { maskEmailForDisplay } from "../utils/maskEmail";

interface MaskedEmailProps {
  email: string | null | undefined;
  className?: string;
}

export function MaskedEmail({
  email,
  className = "",
}: MaskedEmailProps) {
  if (!email) {
    return <span className={className}>حساب کاربری</span>;
  }

  const masked = maskEmailForDisplay(email);

  if (!masked) {
    return (
      <span
        dir="ltr"
        className={`inline-block w-[130px] truncate ${className}`}
      >
        {email}
      </span>
    );
  }

  return (
    <span
      dir="ltr"
      className={`inline-flex h-6 w-[130px] min-w-[130px] max-w-[130px] items-center gap-[3px] overflow-hidden whitespace-nowrap tabular-nums ${className}`}
    >
      <span className="shrink-0">
        {masked.prefix}
      </span>

      <span
        className="inline-flex shrink-0 items-center gap-[2px]"
        aria-hidden="true"
      >
        {Array.from({
          length: masked.maskedCharacterCount,
        }).map((_, index) => (
          <span
            key={index}
            className="h-[5px] w-[5px] rounded-full bg-gradient-to-br from-primary to-primary/40 shadow-[0_0_4px_rgba(34,197,94,0.6)]"
          />
        ))}
      </span>

      <span className="min-w-0 truncate">
        {masked.domain}
      </span>
    </span>
  );
}