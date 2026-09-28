// Remove ApiEnvelope from here — use the shared one from @/shared/types/apiResponse

import type { ApiEnvelope } from '@/shared/types/apiResponse'

// Re-export so existing imports don't break
export type { ApiEnvelope }

// ULID is always a string — branded type for safety
export type Ulid = string & { readonly __brand: 'Ulid' }

export type StaffRole = 'super_admin' | 'admin' | 'editor' | 'viewer'

export interface AuthUser {
  id: Ulid          // was: number — migrated to ULID
  name: string
  email: string
  type: StaffRole   // was: string — now strictly typed
}

export interface TokenData {
  access_token: string
  token_type: 'Bearer'
  expires_in: number   // seconds — from backend
  user: AuthUser
}

export interface LoginPayload {
  login: string
  password: string
}

export interface Requires2FAResponse {
  message: string
  requires_2fa: true
  access_token: string  // temp token with ability=2fa:pending
}