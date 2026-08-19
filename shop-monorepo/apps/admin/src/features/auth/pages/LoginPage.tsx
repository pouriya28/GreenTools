import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AxiosError } from "axios"
import { loginRequest, verify2faRequest } from "../api/authApi"
import { useAuthStore } from "../store/authStore"
import { LoginForm } from "../components/LoginForm"
import { Verify2FAForm } from "../components/Verify2FAForm"
import type { LoginFormValues, TotpFormValues } from "../schema"
import type { ApiEnvelope, Requires2FAResponse, TokenData } from "../types"

type Step = "login" | "2fa"

export default function LoginPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  const [step, setStep] = useState<Step>("login")
  const [tempToken, setTempToken] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function handleSuccess(data: ApiEnvelope<TokenData>) {
    setSession(data.data.access_token, data.data.user)
    navigate("/dashboard", { replace: true })
  }

  async function handleLogin(values: LoginFormValues) {
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const result = await loginRequest(values)

      if ("requires_2fa" in result && result.requires_2fa) {
        setTempToken((result as Requires2FAResponse).access_token)
        setStep("2fa")
        return
      }

      handleSuccess(result as ApiEnvelope<TokenData>)
    } catch (err) {
      const message =
        err instanceof AxiosError && err.response?.data?.message
          ? err.response.data.message
          : "خطایی رخ داد. دوباره تلاش کنید."
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleVerify2FA(values: TotpFormValues) {
    if (!tempToken) return
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const result = await verify2faRequest(values.totp_code, tempToken)
      handleSuccess(result)
    } catch (err) {
      const message =
        err instanceof AxiosError && err.response?.data?.message
          ? err.response.data.message
          : "کد وارد شده نامعتبر است."
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-0 px-4" dir="rtl">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-bg-1 p-8 shadow-2xl">
        <h1 className="mb-1 text-xl font-bold text-text-1">
          {step === "login" ? "ورود به پنل ادمین" : "تایید دو مرحله‌ای"}
        </h1>
        <p className="mb-6 text-sm text-text-3">
          {step === "login"
            ? "با ایمیل یا نام کاربری خود وارد شوید"
            : "کد اپلیکیشن Authenticator را وارد کنید"}
        </p>

        {step === "login" ? (
          <LoginForm
            onSubmit={handleLogin}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
          />
        ) : (
          <Verify2FAForm
            onSubmit={handleVerify2FA}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
          />
        )}
      </div>
    </div>
  )
}