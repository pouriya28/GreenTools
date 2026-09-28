import { create } from "zustand"
import type { AuthUser } from "../types"

interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  // idle   = app just loaded, auth status unknown yet
  // authenticated   = valid session
  // unauthenticated = no session / logged out
  status: "idle" | "authenticated" | "unauthenticated"

  setSession: (token: string, user: AuthUser) => void
  clearSession: () => void
  setStatus: (status: AuthState["status"]) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: "idle",

  setSession: (accessToken, user) =>
    set({ accessToken, user, status: "authenticated" }),

  clearSession: () =>
    set({ accessToken: null, user: null, status: "unauthenticated" }),

  // used by axios interceptor after silent refresh fails
  setStatus: (status) => set({ status }),
}))

// Typed selectors — prevent unnecessary re-renders
export const selectAccessToken = (s: AuthState) => s.accessToken
export const selectUser = (s: AuthState) => s.user
export const selectAuthStatus = (s: AuthState) => s.status
export const selectIsAuthenticated = (s: AuthState) =>
  s.status === "authenticated"