import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { totpSchema, type TotpFormValues } from "../schema"
import { Button } from "@/components/ui/button"

interface Verify2FAFormProps {
  onSubmit: (values: TotpFormValues) => void
  isSubmitting: boolean
  errorMessage: string | null
}

export function Verify2FAForm({ onSubmit, isSubmitting, errorMessage }: Verify2FAFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TotpFormValues>({
    resolver: zodResolver(totpSchema),
  })

  const totpValue = watch("totp_code", "")

  // Auto-submit when exactly 6 digits entered
  useEffect(() => {
    if (totpValue?.length === 6 && !isSubmitting) {
      handleSubmit(onSubmit)()
    }
  }, [totpValue, isSubmitting, handleSubmit, onSubmit])

  const { onChange, ...restRegister } = register("totp_code")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="totp_code" className="text-sm text-text-2">
          کد شش‌رقمی اپلیکیشن احراز هویت
        </label>
        <input
          id="totp_code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          autoComplete="one-time-code"
          autoFocus
          {...restRegister}
          onChange={(e) => {
            // Strip non-numeric characters before passing to RHF
            const digits = e.target.value.replace(/\D/g, "")
            e.target.value = digits
            onChange(e)
          }}
          className="rounded-lg border border-border bg-bg-2 px-3.5 py-2.5 text-center text-lg tracking-[0.5em] text-text-1 outline-none transition-colors focus:border-primary font-mono"
        />
        {errors.totp_code && (
          <span className="text-xs text-danger">{errors.totp_code.message}</span>
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
        className="mt-2 bg-gradient-to-l from-primary to-secondary text-white hover:opacity-90"
      >
        {isSubmitting ? "در حال بررسی..." : "تایید"}
      </Button>
    </form>
  )
}