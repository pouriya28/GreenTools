import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "../../../store/authStore";
import { ApiError } from "../../../shared/error/ApiError";
import { OtpInput } from "./OtpInput";

const loginSchema = z.object({
  phone: z
    .string()
    .min(1, "شماره موبایل الزامی است")
    .regex(/^09\d{9}$/, "شماره موبایل وارد شده معتبر نیست (مثال: 09123456789)"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
});

const twoFactorSchema = z.object({
  code: z
    .string()
    .length(6, "کد تایید باید ۶ رقم باشد")
    .regex(/^\d+$/, "کد تایید فقط باید شامل اعداد باشد"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

export function LoginForm() {
  const [requires2FA, setRequires2FA] = useState(false);
  const [credentials, setCredentials] = useState<LoginFormData | null>(null);
  
  // ۱. State جدید برای کنترل نمایش/مخفی‌سازی رمز عبور
  const [showPassword, setShowPassword] = useState(false);

  const { login, verify2FA, isLoading } = useAuthStore();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "", password: "" },
  });

  const twoFactorForm = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { code: "" },
  });

  const handleLogin = async (data: LoginFormData) => {
    try {
      const res = await login(data);
      if (res?.requires2FA) {
        setCredentials(data);
        setRequires2FA(true);
      }
    } catch (err) {
      if (err instanceof ApiError && err.isValidationError && err.errors) {
        Object.entries(err.errors).forEach(([key, messages]) => {
          loginForm.setError(key as keyof LoginFormData, {
            type: "server",
            message: messages[0],
          });
        });
      }
    }
  };

  const handleVerify2FA = async (data: TwoFactorFormData) => {
    if (!credentials) return;

    try {
      await verify2FA({
        phone: credentials.phone,
        code: data.code,
      });
    } catch (err) {
      if (err instanceof ApiError && err.isValidationError && err.errors) {
        Object.entries(err.errors).forEach(([key, messages]) => {
          twoFactorForm.setError(key as keyof TwoFactorFormData, {
            type: "server",
            message: messages[0],
          });
        });
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-surface rounded-2xl shadow-lg border border-border">
      {!requires2FA ? (
        <form onSubmit={loginForm.handleSubmit(handleLogin)} className="flex flex-col gap-4">
          <div className="text-center mb-2">
            <h2 className="text-xl font-bold text-text">ورود به حساب کاربری</h2>
            <p className="text-xs text-text-secondary mt-1">
              جهت ورود، شماره موبایل و رمز عبور خود را وارد کنید.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">شماره موبایل</label>
            <input
              {...loginForm.register("phone")}
              type="tel"
              dir="ltr"
              placeholder="09123456789"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {loginForm.formState.errors.phone && (
              <p className="text-xs text-error mt-1">
                {loginForm.formState.errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">رمز عبور</label>
            {/* ۲. کانتینر نسبی برای قرارگیری آیکون چشم روی فیلد ورودی */}
            <div className="relative">
              <input
                {...loginForm.register("password")}
                type={showPassword ? "text" : "password"}
                dir="ltr"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-background text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text transition-colors p-1"
                aria-label={showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
              >
                {showPassword ? (
                  // آیکون چشم بسته (Hide)
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  // آیکون چشم باز (Show)
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12c1.274 4.057 5.065 7 9.542 7 4.477 0 8.268-2.943 9.542-7-1.274-4.057-5.064-7-9.542-7-4.477 0-8.268 2.943-9.542 7z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {loginForm.formState.errors.password && (
              <p className="text-xs text-error mt-1">
                {loginForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
          >
            {isLoading ? "در حال ورود..." : "ورود"}
          </button>
        </form>
      ) : (
        /* --- مرحله ورود کد تایید ۲FA --- */
        <form onSubmit={twoFactorForm.handleSubmit(handleVerify2FA)} className="flex flex-col gap-5">
          <div className="text-center mb-1">
            <h2 className="text-xl font-bold text-text">تایید دو مرحله‌ای (2FA)</h2>
            <p className="text-xs text-text-secondary mt-1">
              کد ۶ رقمی برنامه‌ Authenticator خود را وارد کنید.
            </p>
          </div>

          <div>
            <Controller
              name="code"
              control={twoFactorForm.control}
              render={({ field, fieldState }) => (
                <OtpInput
                  length={6}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    if (val.length === 6) {
                      twoFactorForm.handleSubmit(handleVerify2FA)();
                    }
                  }}
                  error={!!fieldState.error}
                  disabled={isLoading}
                />
              )}
            />

            {twoFactorForm.formState.errors.code && (
              <p className="text-xs text-error mt-2 text-center">
                {twoFactorForm.formState.errors.code.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
          >
            {isLoading ? "در حال بررسی..." : "تایید و ورود"}
          </button>

          <button
            type="button"
            onClick={() => setRequires2FA(false)}
            className="text-xs text-primary hover:underline text-center"
          >
            بازگشت به فرم ورود
          </button>
        </form>
      )}
    </div>
  );
}