import { AxiosError } from "axios"
import type { FieldValues, Path, UseFormSetError } from "react-hook-form"
import type { ApiErrorResponse } from "@/shared/types/apiResponse"

/** نسخه‌ی نرمال‌شده‌ی هر خطای API — چه از envelope جدید، چه fallback خام. */
export class ApiError {
  readonly status: number
  readonly code: string
  readonly message: string
  readonly errors: Record<string, string[]>
  readonly retryAfter: number | null
  readonly requestId: string | null

  constructor(err: unknown, fallback = "خطایی رخ داد. دوباره تلاش کنید.") {
    if (err instanceof AxiosError && err.response) {
      const body = err.response.data as Partial<ApiErrorResponse> | undefined
      this.status = err.response.status
      this.code = body?.code ?? `HTTP_${this.status}`
      this.message = body?.message ?? fallback
      this.errors = body?.errors ?? {}
      this.retryAfter = body?.meta?.retry_after ?? null
      this.requestId = body?.meta?.request_id ?? null
      return
    }

    // خطای شبکه (قطعی اینترنت، CORS، timeout و ...) — پاسخی از سرور نیومده
    this.status = 0
    this.code = "NETWORK_ERROR"
    this.message = "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید."
    this.errors = {}
    this.retryAfter = null
    this.requestId = null
  }

  get isValidation() {
    return this.status === 422
  }
  get isForbidden() {
    return this.status === 403
  }
  get isRateLimited() {
    return this.status === 429
  }
  get isMaintenance() {
    return this.status === 503
  }
  get isNetwork() {
    return this.status === 0
  }
}

/** @deprecated از ApiError.isForbidden استفاده کن؛ فقط برای سازگاری نگه داشته شده */
export function isForbiddenError(err: unknown): boolean {
  return err instanceof AxiosError && err.response?.status === 403
}

/**
 * @deprecated از `new ApiError(err).message` استفاده کن.
 * چون بک‌اند الان همیشه پیام فارسی صحیح می‌فرسته (حتی برای 403)، دیگه
 * لازم نیست این‌جا override دستی بزنیم.
 */
export function getApiErrorMessage(
  err: unknown,
  fallback = "خطایی رخ داد. دوباره تلاش کنید."
): string {
  return new ApiError(err, fallback).message
}

/**
 * اگه خطا 422 با errors فیلدی باشه، مستقیم روی فرم react-hook-form می‌شونه.
 * رفتار و امضا دقیقاً مثل قبل — فقط حالا shake/glow هم از طریق FieldShake
 * روی همون فیلد اتفاق می‌افته چون setError باعث تغییر fieldState.error میشه.
 */
export function applyValidationErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>
): boolean {
  const apiError = new ApiError(err)
  if (!apiError.isValidation || Object.keys(apiError.errors).length === 0) {
    return false
  }

  for (const [field, messages] of Object.entries(apiError.errors)) {
    if (messages?.[0]) {
      setError(field as Path<T>, { type: "server", message: messages[0] })
    }
  }

  return true
}