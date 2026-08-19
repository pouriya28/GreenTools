import React, { useRef, useState, useEffect } from "react";

interface OtpInputProps {
  length?: number;
  value?: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export function OtpInput({
  length = 6,
  value = "",
  onChange,
  disabled = false,
  error = false,
}: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // هماهنگ‌سازی با مقادیر خارجی (مثلاً Reset شدن فرم)
  useEffect(() => {
    const valArray = value.split("").slice(0, length);
    const newOtp = Array(length)
      .fill("")
      .map((_, i) => valArray[i] || "");
    setOtp(newOtp);
  }, [value, length]);

  // مدیریت تغییر تایپ در خانه‌ها
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    // فقط دریافت اعداد (جلوگیری از کاراکترهای غیرعددی)
    if (!/^\d*$/.test(val)) return;

    const newOtp = [...otp];
    // دریافت آخرین کاراکتر وارد شده (در صورت تایپ مجدد روی خانه پر)
    const digit = val.substring(val.length - 1);
    newOtp[index] = digit;
    setOtp(newOtp);

    const fullCode = newOtp.join("");
    onChange(fullCode);

    // انتقال خودکار فوکوس به خانه‌ی بعدی
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // مدیریت کلیدهای کیبورد (Backspace و کلیدهای جهت‌نما)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // اگر خانه فعلی خالی است، خانه قبلی پاک و فوکوس به آن منتقل می‌شود
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        onChange(newOtp.join(""));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index < length - 1) {
      // جابجایی فوکوس در حالت LTR
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "ArrowRight" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // مدیریت Paste (چسباندن کد ۵ یا ۶ رقمی)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);

    if (!pastedData) return;

    const pastedArray = pastedData.split("");
    const newOtp = Array(length)
      .fill("")
      .map((_, i) => pastedArray[i] || "");

    setOtp(newOtp);
    onChange(newOtp.join(""));

    // انتقال فوکوس به آخرین خانه پر شده
    const nextFocusIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-2.5 dir-ltr">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={1}
          value={otp[index]}
          disabled={disabled}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className={`
            w-12 h-14 text-center text-xl font-extrabold rounded-xl border-2
            bg-background transition-all duration-150 focus:outline-none
            ${
              error
                ? "border-error focus:ring-2 focus:ring-error/20"
                : "border-border focus:border-primary focus:ring-4 focus:ring-primary/10"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        />
      ))}
    </div>
  );
}