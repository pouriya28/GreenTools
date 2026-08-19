export type OtpChannel = "phone" | "email";

// بکند فعلاً فقط user_type رو در پاسخ برمی‌گردونه (id, name, type) — نه یک آبجکت کامل یوزر.
// اگر بعداً اندپوینت /me یا پروفایل اضافه شد، این تایپ رو کامل‌تر کن.
export interface AuthUser {
  id: number | string;
  name: string;
  type: "customer" | "staff";
}

export interface SendOtpPayload {
  channel: OtpChannel;
  phone?: string;
  email?: string;
}

export interface VerifyOtpPayload {
  channel: OtpChannel;
  phone?: string;
  email?: string;
  code: string;
}

// شکل واقعی پاسخ بکند (issueTokenPair در ManagesAuthTokens.php)
export interface AuthTokenResponse {
  status: "success";
  message: string;
  data: {
    access_token: string;
    token_type: "Bearer";
    expires_in: number;
    user: AuthUser;
  };
}