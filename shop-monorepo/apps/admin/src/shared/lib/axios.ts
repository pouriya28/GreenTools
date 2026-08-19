import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import { useAuthStore } from "@/features/auth/store/authStore"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // برای ارسال کوکی refresh_token
})

// اینترسپتور درخواست: چسباندن Bearer token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// صف‌بندی درخواست‌هایی که هم‌زمان با 401 مواجه شدن،
// تا فقط یک رفرش واقعی انجام بشه (نه N بار موازی)
let isRefreshing = false
let refreshQueue: Array<(token: string | null) => void> = []

function subscribeToRefresh(cb: (token: string | null) => void) {
  refreshQueue.push(cb)
}

function notifyRefreshSubscribers(token: string | null) {
  refreshQueue.forEach((cb) => cb(token))
  refreshQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    const isRefreshCall = originalRequest?.url?.includes("/auth/refresh")

    if (error.response?.status !== 401 || originalRequest._retry || isRefreshCall) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (isRefreshing) {
      // یه درخواست دیگه در حال رفرشه، صبر کن نتیجه‌ش بیاد
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
      const { data } = await api.post("/auth/refresh")
      const newToken = data.data.access_token as string
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