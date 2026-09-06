//src/lib/axios.ts
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { ApiError, type ApiErrorCode } from "@/shared/error/ApiError";
import { getSafeMessage } from "@/shared/error/statusConfig";
import { notificationService } from "@/shared/notification/notification.service";
import { useAuthStore } from "@/store/authStore";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true,
});

const refreshClient = axios.create({ baseURL: BASE_URL, withCredentials: true });

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function codeFromStatus(status?: number): ApiErrorCode {
  switch (status) {
    case 401: return "unauthorized";
    case 403: return "forbidden";
    case 404: return "not_found";
    case 422: return "validation_error";
    case 429: return "rate_limited";
    default:
      if (!status) return "network_error";
      if (status >= 500) return "server_error";
      return "unknown";
  }
}

// جایگزینِ محلی isApiErrorResponse — چون توی کدهای شما این تابع وجود نداشت
function extractPayload(data: unknown): { message?: string; errors?: Record<string, string[]> } | undefined {
  return typeof data === "object" && data !== null
    ? (data as { message?: string; errors?: Record<string, string[]> })
    : undefined;
}

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!error.response) {
      const isTimeout = error.code === "ECONNABORTED";
      notificationService.error(
        isTimeout ? "درخواست طول کشید. لطفاً دوباره تلاش کنید." : "اتصال اینترنت برقرار نیست."
      );
      return Promise.reject(new ApiError({ status: 0, code: isTimeout ? "timeout" : "network_error", message: "Network Error" }));
    }

    const { status, data } = error.response;
    const payload = extractPayload(data);

    if (status === 403) {
      useAuthStore.getState().clearSession();
      notificationService.error(payload?.message ?? "دسترسی شما مسدود شده است.", {
        action: { label: "پشتیبانی", onClick: () => (window.location.href = "/support") },
        duration: 8000,
      });
      return Promise.reject(new ApiError({ status, code: "forbidden", message: payload?.message ?? "Forbidden" }));
    }

    const safeMessage = getSafeMessage(status, payload?.message);
    const apiError = new ApiError({ status, code: codeFromStatus(status), message: safeMessage, errors: payload?.errors });

    if (status === 401 && originalRequest && !originalRequest._retry && !originalRequest.url?.includes("/auth/refresh")) {
      originalRequest._retry = true;

// src/lib/axios.ts — فقط بخش catch مربوط به رفرش عوض می‌شه

if (!isRefreshing) {
  isRefreshing = true;
  try {
    const { data: refreshData } = await refreshClient.post("/v1/auth/refresh");
    const newAccessToken = refreshData.data.access_token as string;

    useAuthStore.getState().setSession(newAccessToken, refreshData.data.user);

    isRefreshing = false;
    refreshQueue.forEach((cb) => cb(newAccessToken));
    refreshQueue = [];

    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    return api(originalRequest);
  } catch (refreshError) {
    isRefreshing = false;
    refreshQueue.forEach((cb) => cb(null));
    refreshQueue = [];

    const refreshStatus = axios.isAxiosError(refreshError)
      ? refreshError.response?.status
      : undefined;

    if (refreshStatus === 401) {
      // Refresh token itself is genuinely invalid/expired/reused — this
      // really is a logged-out session.
      useAuthStore.getState().clearSession();
      notificationService.error("نشست شما منقضی شده است.", {
        action: { label: "ورود مجدد", onClick: () => (window.location.href = "/login") },
        duration: 6000,
      });
    } else {
      // 429 (rate limited), network blip, or a 5xx on the refresh endpoint —
      // the refresh token may still be perfectly valid. Don't wipe a valid
      // session over a transient failure; just fail this one request.
      notificationService.error("مشکلی موقت در ارتباط با سرور پیش آمد. لطفاً دوباره تلاش کنید.");
    }

    return Promise.reject(apiError);
  }
}

      return new Promise((resolve, reject) => {
        refreshQueue.push((token) => {
          if (!token) return reject(apiError);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    if (status !== 422) {
      notificationService.push({
        tone: status >= 500 ? "critical" : status >= 400 ? "warning" : "error",
        message: safeMessage,
      });
    }

    return Promise.reject(apiError);
  }
);