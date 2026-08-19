import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginFormValues } from "../schema"
import { Button } from "@/components/ui/button"

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => void
  isSubmitting: boolean
  errorMessage: string | null
}

export function LoginForm({ onSubmit, isSubmitting, errorMessage }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
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
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
          className="rounded-lg border border-border bg-bg-2 px-3.5 py-2.5 text-text-1 outline-none transition-colors focus:border-primary"
        />
        {errors.password && (
          <span className="text-xs text-danger">{errors.password.message}</span>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 bg-gradient-to-l from-primary to-secondary text-white shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_35%,transparent)] hover:opacity-90"
      >
        {isSubmitting ? "در حال ورود..." : "ورود"}
      </Button>
    </form>
  )
}