export type OtpChannel = "phone" | "email";

export interface LoyaltyLevel {
  code: string;
  name: string;
  icon: string | null;
}

export interface LoyaltyNextLevel extends LoyaltyLevel {
  points_required: number;
  points_remaining: number;
}

export interface LoyaltySummary {
  points: number;
  level: LoyaltyLevel | null;
  next_level: LoyaltyNextLevel | null;
  progress_percent: number | null;
}

// بکند فعلاً id, name, type رو برمی‌گردونه — loyalty فقط برای مشتری پر می‌شه،
// برای staff همیشه null است (نه undefined) طبق LoyaltyPresenter::present.
export interface AuthUser {
  id: number | string;
  name: string;
  type: "customer" | "staff";
  phone?: string | null;
  email?: string | null;
  loyalty?: LoyaltySummary | null;
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