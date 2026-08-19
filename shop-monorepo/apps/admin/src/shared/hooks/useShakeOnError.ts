import { useEffect, useState } from "react"
import type { FieldError } from "react-hook-form"

/**
 * هر بار که error عوض بشه (حتی به همون پیام قبلی) دوباره shake اجرا میشه،
 * چون react-hook-form تو هر setError یه آبجکت جدید می‌سازه.
 */
export function useShakeOnError(error?: FieldError): boolean {
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    if (!error) return
    setShaking(true)
    const timer = setTimeout(() => setShaking(false), 450)
    return () => clearTimeout(timer)
  }, [error])

  return shaking
}