/**
 * Shared API contract types mirroring the backend's response envelope and
 * pagination shape (`ResponseInterceptor` / `AllExceptionsFilter`).
 */

/** A single machine-readable error entry. */
export interface ApiErrorItem {
  code: string;
  message: string;
  /** Present for field-level validation failures. */
  field?: string;
}

/** The uniform success/error envelope wrapping every backend response. */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: ApiErrorItem[] | null;
}

/** Pagination metadata returned by list endpoints. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** A paginated collection payload. */
export interface Paginated<T> {
  items: T[];
  pagination: PaginationMeta;
}
