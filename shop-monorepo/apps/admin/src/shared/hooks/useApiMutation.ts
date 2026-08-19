import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query"
import type { UseFormSetError, FieldValues } from "react-hook-form"
import { ApiError } from "@/shared/lib/apiError"
import { useNotificationStore } from "@/shared/store/notificationStore"
import { useMaintenanceStore } from "@/shared/store/maintenanceStore"
import type { ApiEnvelope } from "@/shared/types/apiResponse"

interface UseApiMutationExtra<TFieldValues extends FieldValues> {
  /** اگه فرم داری، setError خودشو بده تا خطای 422 خودکار روی فیلدها بشینه */
  setFormError?: UseFormSetError<TFieldValues>
  /** برای صفحاتی که خودشون UI اختصاصی برای خطا دارن و نمی‌خوان داک نشون داده بشه */
  suppressNotification?: boolean
}

export function useApiMutation
  TData = unknown,
  TVariables = void,
  TFieldValues extends FieldValues = FieldValues,
>(
  options: UseMutationOptions<ApiEnvelope<TData>, unknown, TVariables> &
    UseApiMutationExtra<TFieldValues>
): UseMutationResult<ApiEnvelope<TData>, unknown, TVariables> {
  const push = useNotificationStore((s) => s.push)
  const activateMaintenance = useMaintenanceStore((s) => s.activate)

  const { setFormError, suppressNotification, onError, onSuccess, ...rest } = options

  return useMutation({
    ...rest,
    onError: (err, variables, context) => {
      const apiError = new ApiError(err)

      if (apiError.isMaintenance) {
        activateMaintenance(apiError.retryAfter)
      } else if (apiError.isValidation && setFormError) {
        for (const [field, messages] of Object.entries(apiError.errors)) {
          if (messages?.[0]) {
            setFormError(field as never, { type: "server", message: messages[0] })
          }
        }
      } else if (!suppressNotification) {
        push({ kind: "error", message: apiError.message, code: apiError.code })
      }

      onError?.(err, variables, context)
    },
    onSuccess: (data, variables, context) => {
      if (data.success) {
        if (data.message) {
          push({ kind: "success", message: data.message })
        }
        data.warnings?.forEach((w) => push({ kind: "warning", message: w.message, code: w.code }))
      }

      onSuccess?.(data, variables, context)
    },
  })
}