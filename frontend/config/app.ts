import { env } from './env';

/**
 * Typed, app-wide runtime configuration derived from the validated environment.
 * Import this instead of reading `process.env` directly.
 */
export const appConfig = {
  name: env.NEXT_PUBLIC_APP_NAME,
  /** Public origin of this storefront (used for canonical URLs, OG, sitemap). */
  url: env.NEXT_PUBLIC_APP_URL,
  /** Backend REST base, e.g. `http://localhost:4000/api/v1`. */
  apiUrl: env.NEXT_PUBLIC_API_URL,
  /** Better Auth base path (mounted by the backend under the API prefix). */
  authUrl: `${env.NEXT_PUBLIC_API_URL}/auth`,
  locale: 'en-IN',
  currency: 'INR',
  analytics: {
    gaMeasurementId: env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    clarityProjectId: env.NEXT_PUBLIC_CLARITY_PROJECT_ID,
  },
  sentryDsn: env.NEXT_PUBLIC_SENTRY_DSN,
} as const;

export type AppConfig = typeof appConfig;
