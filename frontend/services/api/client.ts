import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

import { appConfig } from '@/config/app';
import type { ApiResponse } from '@/types/api';

import { ApiError, normalizeError } from './errors';

/** Requests that fail transiently are retried this many times (idempotent verbs only). */
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 300;
const IDEMPOTENT_METHODS = new Set(['get', 'head', 'options']);

interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

/**
 * Optional hook invoked whenever the API returns 401. The app registers a
 * handler (e.g. to clear session state / redirect to sign-in). Session cookies
 * are managed by Better Auth server-side; this is the client-side reaction point
 * and the seam where a future silent-refresh flow would live.
 */
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

/**
 * Shared Axios instance. `withCredentials` sends the Better Auth session cookie
 * on cross-origin requests (storefront → API). Responses are left intact; errors
 * are normalised to {@link ApiError}, with bounded retry for transient failures.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: appConfig.apiUrl,
  withCredentials: true,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const normalized = normalizeError(error);

    if (normalized.status === 401) {
      unauthorizedHandler?.();
    }

    const config = axios.isAxiosError(error)
      ? (error.config as RetryConfig | undefined)
      : undefined;
    const method = config?.method?.toLowerCase() ?? '';
    const retriable =
      normalized.status === 0 || (normalized.status >= 500 && normalized.status <= 599);

    if (config && retriable && IDEMPOTENT_METHODS.has(method)) {
      const attempt = config._retryCount ?? 0;
      if (attempt < MAX_RETRIES) {
        config._retryCount = attempt + 1;
        const delay = RETRY_BASE_DELAY_MS * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return apiClient(config);
      }
    }

    return Promise.reject(normalized);
  },
);

/**
 * Perform a request and return the unwrapped `data` payload from the response
 * envelope. Throws {@link ApiError} on failure or a non-success envelope.
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<ApiResponse<T>>(config);
  const body = response.data;
  if (!body.success) {
    const first = body.errors?.[0];
    throw new ApiError(
      body.message,
      first?.code ?? 'REQUEST_FAILED',
      response.status,
      body.errors ?? [],
    );
  }
  return body.data;
}

/** Ergonomic verb helpers over {@link request}. */
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: 'get', url }),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: 'post', url, data }),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: 'patch', url, data }),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: 'put', url, data }),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: 'delete', url }),
} as const;
