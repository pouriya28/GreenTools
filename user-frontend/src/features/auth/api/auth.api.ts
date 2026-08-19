import { api } from "@/lib/axios";
import type { AuthTokenResponse, SendOtpPayload, VerifyOtpPayload } from "../types/auth.types";

export const authApi = {
  sendOtp: async (payload: SendOtpPayload): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>("/v1/auth/customer/send-otp", payload);
    return data;
  },

  verifyOtp: async (payload: VerifyOtpPayload): Promise<AuthTokenResponse> => {
    const { data } = await api.post<AuthTokenResponse>("/v1/auth/customer/verify-otp", payload);
    return data;
  },

  // ⚠️ فعلاً هیچ اندپوینت logout برای مشتری در بکند وجود نداره (فقط استاف داره).
  // پیشنهاد می‌کنم یک CustomerLogoutController مشابه AdminAuthController::logout اضافه کنی
  // تا توکن‌های Sanctum واقعاً revoke بشن، وگرنه توکن‌ها تا انقضا معتبر می‌مونن.
  logout: async (): Promise<void> => {
    await api.post("/v1/auth/customer/logout").catch(() => {
      // اگر مسیر هنوز وجود نداره، خطا رو نادیده می‌گیریم تا خروج سمت کلاینت مسدود نشه
    });
  },
};