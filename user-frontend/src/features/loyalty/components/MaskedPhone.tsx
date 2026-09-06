import { maskPhoneForDisplay } from "../utils/maskPhone";

interface MaskedPhoneProps {
  phone: string | null | undefined;
  className?: string;
}

// Instead of plain "***", hidden digits are rendered as small glowing dots
// that match the site's neon accent — same idea as a password field, but
// styled to fit the pink/purple theme instead of looking like a raw mask.
export function MaskedPhone({ phone, className = "" }: MaskedPhoneProps) {
  if (!phone) return <span className={className}>حساب کاربری</span>;

  const masked = maskPhoneForDisplay(phone);

  if (!masked) {
    return (
      <span dir="ltr" className={className}>
        {phone}
      </span>
    );
  }

  return (
    <span dir="ltr" className={`inline-flex items-center gap-[3px] tabular-nums ${className}`}>
      <span>{masked.prefix}</span>
      <span className="inline-flex items-center gap-[2px] mx-0.5" aria-hidden="true">
        {Array.from({ length: masked.maskedDigitCount }).map((_, i) => (
          <span
            key={i}
            className="w-[5px] h-[5px] rounded-full bg-gradient-to-br from-primary to-primary/40 shadow-[0_0_4px_rgba(34,197,94,0.6)]"
          />
        ))}
      </span>
      <span>{masked.suffix}</span>
    </span>
  );
}