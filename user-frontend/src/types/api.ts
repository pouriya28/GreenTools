export interface ApiSuccessResponse<T> {
  success: true;
  status: number;
  message?: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  status: number;
  code: string;
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Type guard — هیچ‌وقت فرض نکن پاسخ حتماً این شکلیه
export function isApiErrorResponse(payload: unknown): payload is ApiErrorResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "success" in payload &&
    (payload as { success: unknown }).success === false
  );
}