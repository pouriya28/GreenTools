import { api } from "@/shared/lib/axios"
import type { ApiEnvelope, LoginPayload, Requires2FAResponse, TokenData } from "../types"

export async function loginRequest(payload: LoginPayload) {
  const { data } = await api.post<ApiEnvelope<TokenData> | Requires2FAResponse>(
    "/auth/staff/login",
    payload
  )
  return data
}

export async function verify2faRequest(totpCode: string, tempToken: string) {
  const { data } = await api.post<ApiEnvelope<TokenData>>(
    "/auth/staff/verify-2fa",
    { totp_code: totpCode },
    { headers: { Authorization: `Bearer ${tempToken}` } }
  )
  return data
}

export async function logoutRequest() {
  await api.post("/auth/staff/logout")
}

export async function refreshRequest() {
  const { data } = await api.post<ApiEnvelope<TokenData>>("/auth/refresh")
  return data
}