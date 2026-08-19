import { create } from "zustand"
import type { AuthUser } from "../types"

interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  status: "idle" | "authenticated" | "unauthenticated"
  setSession: (token: string, user: AuthUser) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: "idle",
  setSession: (accessToken, user) =>
    set({ accessToken, user, status: "authenticated" }),
  clearSession: () =>
    set({ accessToken: null, user: null, status: "unauthenticated" }),
}))