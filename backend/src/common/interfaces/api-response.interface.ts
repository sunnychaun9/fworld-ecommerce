/**
 * Standard API response envelope (TRD §11 / 005_API.md).
 * Every successful response and every error is shaped like this.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
}
