import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import { useAuthStore } from "@/features/auth/store/authStore"
import { waitForOperationVerification } from "@/features/auth/utils/operationVerificationBridge"
import type { ApiEnvelope, ApiSuccessResponse } from "@/shared/types/apiResponse"
import type { TokenData } from "@/features/auth/types"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // send httpOnly refresh_token cookie
})

// Attach Bearer token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Queue requests that hit 401 while a refresh is already in flight
// so only one real refresh happens (not N parallel refreshes)
let isRefreshing = false
let refreshQueue: Array<(token: string | null) => void> = []

function subscribeToRefresh(cb: (token: string | null) => void) {
  refreshQueue.push(cb)
}

function notifyRefreshSubscribers(token: string | null) {
  refreshQueue.forEach((cb) => cb(token))
  refreshQueue = []
}

// These routes must never trigger a refresh attempt:
// login (no session exists yet) and refresh itself (prevent infinite loop)
const AUTH_ROUTES_EXCLUDED_FROM_REFRESH = ["/auth/staff/login", "/auth/refresh"]

// Type guard — validate refresh response shape before using it
function isValidTokenData(data: unknown): data is ApiSuccessResponse<TokenData> {
  if (!data || typeof data !== "object") return false
  const d = data as Record<string, unknown>
  if (d.success !== true || !d.data || typeof d.data !== "object") return false
  const inner = d.data as Record<string, unknown>
  return (
    typeof inner.access_token === "string" &&
    inner.access_token.length > 0 &&
    typeof inner.user === "object" &&
    inner.user !== null
  )
}

type ApiErrorBody = {
  code?: string
  message?: string
  errors?: Record<string, string[]>
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
      _operationRetry?: boolean
    }

    // 1. Operation password: 403 + OPERATION_VERIFICATION_REQUIRED
    // Checked before 401 — completely independent from token refresh
    const isOperationVerificationRequired =
      error.response?.status === 403 &&
      error.response.data?.code === "OPERATION_VERIFICATION_REQUIRED"

    if (isOperationVerificationRequired && !originalRequest._operationRetry) {
      originalRequest._operationRetry = true
      const verified = await waitForOperationVerification()
      if (verified) {
        return api(originalRequest)
      }
      return Promise.reject(error)
    }

    // 2. Token refresh: 401
    // If url is missing, treat as excluded to avoid unintended refresh
    const requestUrl = originalRequest?.url ?? ""
    const isExcludedRoute = AUTH_ROUTES_EXCLUDED_FROM_REFRESH.some((route) =>
      requestUrl.includes(route)
    )

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isExcludedRoute
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (isRefreshing) {
      // Another request is already refreshing — wait for its result
      return new Promise((resolve, reject) => {
        subscribeToRefresh((token) => {
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          } else {
            reject(error)
          }
        })
      })
    }

    isRefreshing = true

    try {
      const { data } = await api.post<ApiEnvelope<TokenData>>("/auth/refresh", null, {
        timeout: 10_000, // prevent hanging forever if refresh endpoint is unreachable
      })

      // Validate shape before trusting the response
      if (!isValidTokenData(data)) {
        throw new Error("Invalid refresh response shape")
      }

      const newToken = data.data.access_token
      useAuthStore.getState().setSession(newToken, data.data.user)
      notifyRefreshSubscribers(newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return api(originalRequest)
    } catch (refreshError) {
      notifyRefreshSubscribers(null)
      useAuthStore.getState().clearSession()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)