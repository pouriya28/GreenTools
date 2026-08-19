export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation_error"
  | "rate_limited"
  | "server_error"
  | "network_error"
  | "timeout"
  | "unknown";

interface ApiErrorParams {
  status: number;
  code: ApiErrorCode;
  message: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  status: number;
  code: ApiErrorCode;
  errors?: Record<string, string[]>;

  constructor({ status, code, message, errors }: ApiErrorParams) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }

  get isValidationError(): boolean {
    return this.code === "validation_error" && !!this.errors;
  }
}