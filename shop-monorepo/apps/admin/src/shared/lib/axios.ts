import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import { useAuthStore } from "@/features/auth/store/authStore"
import { waitForOperationVerification } from "@/features/auth/utils/operationVerificationBridge"

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

// مسیرهایی که هرگز نباید باعث تلاش برای refresh بشن:
// خودِ لاگین (چون یعنی هنوز سشنی وجود نداره) و خودِ رفرش (برای جلوگیری از حلقه بی‌نهایت)
const AUTH_ROUTES_EXCLUDED_FROM_REFRESH = ["/auth/staff/login", "/auth/refresh"]

type ApiErrorBody = { code?: string }

api.interceptors.response.use(
	(response) => response,
	async (error: AxiosError<ApiErrorBody>) => {
		const originalRequest = error.config as InternalAxiosRequestConfig & {
			_retry?: boolean
			_operationRetry?: boolean
		}

		// --- ۱. رمز عملیاتی: 403 + کد OPERATION_VERIFICATION_REQUIRED ---
		// این چک اول از 401 است چون کاملاً مستقل است و به بازتلاش refresh ربطی ندارد.
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

		// --- ۲. رفرش توکن: 401 (بدون تغییر نسبت به قبل) ---
		const isExcludedRoute = AUTH_ROUTES_EXCLUDED_FROM_REFRESH.some((route) =>
			originalRequest?.url?.includes(route)
		)

		if (error.response?.status !== 401 || originalRequest._retry || isExcludedRoute) {
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