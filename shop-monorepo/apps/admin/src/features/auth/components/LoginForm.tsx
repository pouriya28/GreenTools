import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FiEye, FiEyeOff } from "react-icons/fi"
import { loginSchema, type LoginFormValues } from "../schema"
import { Button } from "@/components/ui/button"

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => void
  isSubmitting: boolean
  errorMessage: string | null
  lockoutSeconds: number
}

function formatLockoutTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function LoginForm({
  onSubmit,
  isSubmitting,
  errorMessage,
  lockoutSeconds,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const isLockedOut = lockoutSeconds > 0

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login" className="text-sm text-text-2">
          ایمیل یا نام کاربری
        </label>

        <input
          id="login"
          type="text"
          autoComplete="username"
          {...register("login")}
          className="rounded-lg border border-border bg-bg-2 px-3.5 py-2.5 text-text-1 outline-none transition-colors focus:border-primary"
        />

        {errors.login && (
          <span className="text-xs text-danger">{errors.login.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm text-text-2">
          رمز عبور
        </label>

        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            {...register("password")}
            className="w-full rounded-lg border border-border bg-bg-2 px-3.5 py-2.5 text-text-1 outline-none transition-colors focus:border-primary ltr:pr-10 rtl:pl-10"
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={
              showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"
            }
            className="absolute inset-y-0 ltr:right-3 rtl:left-3 flex items-center text-text-3 transition-colors hover:text-text-1"
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>

        {errors.password && (
          <span className="text-xs text-danger">
            {errors.password.message}
          </span>
        )}
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
        >
          <div>{errorMessage}</div>

          {isLockedOut && (
            <div className="mt-2 text-center font-mono text-base font-semibold">
              {formatLockoutTime(lockoutSeconds)}
            </div>
          )}
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || isLockedOut}
        className="mt-2 bg-gradient-to-l from-primary to-secondary text-white shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_35%,transparent)] hover:opacity-90"
      >
        {isSubmitting
          ? "در حال ورود..."
          : isLockedOut
            ? `تلاش مجدد در ${formatLockoutTime(lockoutSeconds)}`
            : "ورود"}
      </Button>
    </form>
  )
}