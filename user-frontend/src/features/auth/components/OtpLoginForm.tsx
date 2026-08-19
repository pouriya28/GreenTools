import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FiSmartphone, FiMail } from "react-icons/fi";
import { useAuthStore } from "@/store/authStore";
import { ApiError } from "@/shared/error/ApiError";
import { normalizeDigits, sanitizeEmailInput } from "@/shared/utils/normalizeDigits";
import type { OtpChannel } from "../types/auth.types";
import { OtpInput } from "./OtpInput";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

const PHONE_REGEX = /^09\d{9}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const identifierSchema = z
  .object({
    identifier: z.string().min(1, "این فیلد الزامی است"),
  });

const otpSchema = z.object({
  code: z
    .string()
    .length(OTP_LENGTH, `کد تایید باید ${OTP_LENGTH} رقم باشد`)
    .regex(/^\d+$/, "کد تایید فقط باید شامل اعداد باشد"),
});

type IdentifierFormData = z.infer<typeof identifierSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

interface OtpLoginFormProps {
  onSuccess?: () => void;
}

export function OtpLoginForm({ onSuccess }: OtpLoginFormProps) {
  const [channel, setChannel] = useState<OtpChannel>("phone");
  const [step, setStep] = useState<"identifier" | "code">("identifier");
  const [identifier, setIdentifier] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);

  const { sendOtp, verifyOtp, isLoading } = useAuthStore();

  // اعتبارسنجی real-time: mode="onChange" باعث می‌شه خطاها حین تایپ آپدیت بشن، نه فقط موقع submit
  const identifierForm = useForm<IdentifierFormData>({
    resolver: zodResolver(identifierSchema),
    defaultValues: { identifier: "" },
    mode: "onChange",
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
    mode: "onChange",
  });

  const identifierValue = identifierForm.watch("identifier");

  // اعتبارسنجی real-time فرمت (جدا از zod، چون پیام‌های سفارشی و وابسته به channel داریم)
  useEffect(() => {
    if (!identifierValue) {
      identifierForm.clearErrors("identifier");
      return;
    }
    const isValid =
      channel === "phone" ? PHONE_REGEX.test(identifierValue) : EMAIL_REGEX.test(identifierValue);

    if (!isValid) {
      identifierForm.setError("identifier", {
        type: "format",
        message:
          channel === "phone"
            ? "شماره موبایل باید ۱۱ رقم و با 09 شروع شود"
            : "فرمت ایمیل معتبر نیست",
      });
    } else {
      identifierForm.clearErrors("identifier");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifierValue, channel]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // فیلد موبایل: فقط عدد (فارسی/عربی/انگلیسی همه به انگلیسی تبدیل و بقیه حذف می‌شن)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = normalizeDigits(e.target.value).slice(0, 11);
    identifierForm.setValue("identifier", cleaned, { shouldValidate: true });
  };

  // فیلد ایمیل: کاراکترهای غیرمجاز (فارسی، فاصله، ...) اصلاً وارد نمی‌شن
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = sanitizeEmailInput(e.target.value);
    identifierForm.setValue("identifier", cleaned, { shouldValidate: true });
  };

  // جلوگیری سخت‌گیرانه‌تر از تایپ کاراکتر فارسی در ایمیل، حتی قبل از ورود به state
  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedControlKeys = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"];
    if (allowedControlKeys.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (!/^[a-zA-Z0-9@._\-+]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleSendOtp = async (data: IdentifierFormData) => {
    const isValid = channel === "phone" ? PHONE_REGEX.test(data.identifier) : EMAIL_REGEX.test(data.identifier);
    if (!isValid) return;

    try {
      await sendOtp({ channel, [channel]: data.identifier });
      setIdentifier(data.identifier);
      setStep("code");
      setTimeLeft(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      if (err instanceof ApiError && err.isValidationError && err.errors) {
        const firstError = Object.values(err.errors)[0]?.[0];
        if (firstError) identifierForm.setError("identifier", { message: firstError });
      }
    }
  };

  const handleVerifyOtp = async (data: OtpFormData) => {
    try {
      await verifyOtp({ channel, [channel]: identifier, code: data.code });
      onSuccess?.(); // ورود موفق → بستن خودکار مودال
    } catch (err) {
      if (err instanceof ApiError) {
        otpForm.setError("code", { message: err.message });
      }
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0 || isLoading) return; // جلوگیری از کلیک اسپم حتی اگه تایمر صفر باشه ولی درخواست قبلی هنوز در حال اجراست
    try {
      await sendOtp({ channel, [channel]: identifier });
      setTimeLeft(RESEND_COOLDOWN_SECONDS);
      otpForm.reset({ code: "" });
    } catch {
      // توسط اینترسپتور مدیریت می‌شود
    }
  };

  const handleBack = () => {
    setStep("identifier");
    otpForm.reset({ code: "" });
  };

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  return (
    <div className="w-full">
      {step === "identifier" ? (
        <form onSubmit={identifierForm.handleSubmit(handleSendOtp)} className="flex flex-col gap-4">
          <div className="text-center mb-2">
            <h2 className="text-xl font-bold text-text">ورود / ثبت‌نام</h2>
            <p className="text-xs text-text-secondary mt-1">روش دریافت کد تایید را انتخاب کنید.</p>
          </div>

          <div className="flex bg-background/60 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => {
                setChannel("phone");
                identifierForm.reset();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                channel === "phone" ? "bg-primary text-black shadow-md" : "text-text-secondary hover:text-text"
              }`}
            >
              <FiSmartphone className="text-sm" />
              <span>موبایل</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setChannel("email");
                identifierForm.reset();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                channel === "email" ? "bg-primary text-black shadow-md" : "text-text-secondary hover:text-text"
              }`}
            >
              <FiMail className="text-sm" />
              <span>ایمیل</span>
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {channel === "phone" ? "شماره موبایل" : "ایمیل"}
            </label>
            {channel === "phone" ? (
              <input
                value={identifierForm.watch("identifier")}
                onChange={handlePhoneChange}
                type="tel"
                inputMode="numeric" // کیبورد عددی روی موبایل
                pattern="[0-9]*"
                autoComplete="tel"
                maxLength={11}
                dir="ltr"
                placeholder="09123456789"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ) : (
              <input
                value={identifierForm.watch("identifier")}
                onChange={handleEmailChange}
                onKeyDown={handleEmailKeyDown}
                type="email"
                inputMode="email"
                autoComplete="email"
                dir="ltr"
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            )}
            {identifierForm.formState.errors.identifier && (
              <p className="text-xs text-error mt-1">{identifierForm.formState.errors.identifier.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !identifierForm.formState.isValid}
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
          >
            {isLoading ? "در حال ارسال..." : "ارسال کد تایید"}
          </button>
        </form>
      ) : (
        <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="flex flex-col gap-5">
          <div className="text-center mb-1">
            <h2 className="text-xl font-bold text-text">تایید کد</h2>
            <p className="text-xs text-text-secondary mt-1">
              کد ارسال‌شده به <span className="font-bold dir-ltr inline-block">{identifier}</span> را وارد کنید.
            </p>
          </div>

          <Controller
            name="code"
            control={otpForm.control}
            render={({ field, fieldState }) => (
              <OtpInput
                length={OTP_LENGTH}
                value={field.value}
                onChange={(val) => {
                  field.onChange(val);
                  if (val.length === OTP_LENGTH) otpForm.handleSubmit(handleVerifyOtp)();
                }}
                error={!!fieldState.error}
                disabled={isLoading}
              />
            )}
          />
          {otpForm.formState.errors.code && (
            <p className="text-xs text-error text-center">{otpForm.formState.errors.code.message}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
          >
            {isLoading ? "در حال بررسی..." : "تایید و ورود"}
          </button>

          <div className="flex items-center justify-between text-xs text-text-secondary pt-1">
            <button type="button" onClick={handleBack} className="hover:underline text-primary">
              ویرایش {channel === "phone" ? "شماره" : "ایمیل"}
            </button>
            {timeLeft > 0 ? (
              <span>ارسال مجدد تا {formatTime(timeLeft)}</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="font-bold text-primary hover:underline disabled:opacity-50"
              >
                ارسال مجدد کد
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}