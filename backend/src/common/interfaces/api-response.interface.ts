/**
 * A single machine-readable error (API D4). `code` is a stable
 * `UPPER_SNAKE_CASE` identifier clients branch on; `field` is the offending
 * input path when applicable; `message` is human-readable.
 */
export interface ApiError {
  code: string;
  field?: string;
  message: string;
}

/**
 * Standard API response envelope (TRD §11 / 005_API.md / API D3–D4).
 * Every successful response and every error is shaped like this.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  errors: ApiError[];
}
