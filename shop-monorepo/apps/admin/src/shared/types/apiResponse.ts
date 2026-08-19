export interface ApiMeta {
  request_id: string | null
  timestamp: string
  retry_after?: number | null
}

export interface ApiWarning {
  code: string
  message: string
}

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message: string | null
  warnings: ApiWarning[]
  meta: ApiMeta
}

export interface ApiErrorResponse {
  success: false
  data: null
  message: string
  code: string
  errors?: Record<string, string[]>
  meta: ApiMeta
}

export type ApiEnvelope<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse