import { create } from "zustand";
import { authApi } from "@/features/auth/api/auth.api";
import type { AuthUser, SendOtpPayload, VerifyOtpPayload } from "@/features/auth/types/auth.types";
import { notificationService } from "@/shared/notification/notification.service";
import { api } from "@/lib/axios";
import { ApiError } from "@/shared/error/ApiError";
interface AuthState {
  accessToken: string | null; // فقط در حافظه — هرگز persist نمی‌شه
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  setSession: (token: string, user: AuthUser) => void;
  clearSession: () => void;

  initAuth: () => Promise<void>;
  sendOtp: (payload: SendOtpPayload) => Promise<void>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  setSession: (token, user) => set({ accessToken: token, user, isAuthenticated: true }),

  clearSession: () => set({ accessToken: null, user: null, isAuthenticated: false }),

  // در لود اولیه‌ی اپ، بجای خوندن از localStorage، سعی می‌کنیم با کوکی httpOnly رفرش کنیم.
  // اگه کوکی معتبری نباشه، یعنی کاربر لاگین نیست.
// src/store/authStore.ts

initAuth: async () => {
  set({ isLoading: true });
  try {
    const { data } = await api.post("/v1/auth/refresh");
    get().setSession(data.data.access_token, data.data.user);
  } catch (err) {
    // Only clear the session on a definitive 401 (no valid refresh token
    // at all). A 429 or network hiccup during the very first page-load
    // refresh doesn't mean the user is logged out — just that this
    // particular attempt failed; retrying later (or the next page load)
    // can still succeed with the same still-valid cookie.
    if (err instanceof ApiError && err.status === 401) {
      get().clearSession();
    }
  } finally {
    set({ isLoading: false, isInitialized: true });
  }
},

  sendOtp: async (payload) => {
    set({ isLoading: true });
    try {
      const res = await authApi.sendOtp(payload);
      notificationService.success(res.message);
    } finally {
      set({ isLoading: false });
    }
  },

  verifyOtp: async (payload) => {
    set({ isLoading: true });
    try {
      const res = await authApi.verifyOtp(payload);
      get().setSession(res.data.access_token, res.data.user);
      notificationService.success("ورود موفقیت‌آمیز بود.");
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      get().clearSession();
      notificationService.info("از حساب کاربری خارج شدید.");
    }
  },
}));