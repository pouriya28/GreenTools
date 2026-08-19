export interface AuthUser {
  id: number
  name: string
  type: string
}

export interface TokenData {
  access_token: string
  token_type: string
  expires_in: number
  user: AuthUser
}

export interface ApiEnvelope<T> {
  status: string
  message: string
  data: T
}

export interface LoginPayload {
  login: string
  password: string
}

export interface Requires2FAResponse {
  message: string
  requires_2fa: true
  access_token: string // توکن موقت با ability=2fa:pending
}