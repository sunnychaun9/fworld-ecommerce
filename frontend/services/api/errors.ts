import { AxiosError } from 'axios';

import type { ApiErrorItem, ApiResponse } from '@/types/api';

/**
 * Normalised transport error. Every failed request surfaces as an `ApiError`
 * carrying the backend's stable `code`, HTTP `status`, and the field-level
 * `errors` list — so UI code never has to branch on Axios internals.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly errors: ApiErrorItem[];

  constructor(message: string, code: string, status: number, errors: ApiErrorItem[] = []) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.errors = errors;
  }

  /** True for network/timeout failures where no response was received. */
  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return typeof value === 'object' && value !== null && 'success' in value && 'message' in value;
}

/** Convert any thrown value (Axios or otherwise) into an {@link ApiError}. */
export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;
    if (isApiResponse(body)) {
      const first = body.errors?.[0];
      return new ApiError(
        body.message || error.message,
        first?.code ?? 'REQUEST_FAILED',
        status,
        body.errors ?? [],
      );
    }
    return new ApiError(
      status === 0 ? 'Network error — please check your connection.' : error.message,
      status === 0 ? 'NETWORK_ERROR' : 'REQUEST_FAILED',
      status,
    );
  }

  return new ApiError(
    error instanceof Error ? error.message : 'Unexpected error',
    'UNKNOWN_ERROR',
    0,
  );
}
