import { DEV_AUTH_SECRET } from './env.validation';

/**
 * Typed configuration factory consumed by `@nestjs/config`.
 * Values are read from environment variables validated by `env.validation.ts`.
 * Integration-specific config (payments, shipping, storage, search) is added in
 * the sprint that introduces it.
 */
export default () => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const isProduction = nodeEnv === 'production';

  // Allowed browser origins, parsed once. `CORS_ORIGIN` may be a comma-separated
  // list (e.g. apex + www in production); split so both the CORS layer and Better
  // Auth's trustedOrigins receive an array — a single joined string would match
  // no origin at the CORS layer.
  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return {
    nodeEnv,
    version: process.env.npm_package_version ?? '0.1.0',
    port: Number(process.env.PORT ?? 4000),
    apiPrefix: process.env.API_PREFIX ?? 'api/v1',
    corsOrigins,
    database: {
      url: process.env.DATABASE_URL ?? '',
    },
    rateLimit: {
      ttl: Number(process.env.RATE_LIMIT_TTL ?? 60_000),
      limit: Number(process.env.RATE_LIMIT_LIMIT ?? 100),
    },
    auth: {
      // No production fallback secret: in production env validation guarantees a
      // real BETTER_AUTH_SECRET, so the dev placeholder is used only outside prod.
      secret: process.env.BETTER_AUTH_SECRET ?? (isProduction ? '' : DEV_AUTH_SECRET),
      baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:4000',
      // Origins allowed to use cookie sessions (CSRF/origin validation).
      // Same source as the CORS layer above (single parse).
      trustedOrigins: corsOrigins,
      // Cross-subdomain cookie domain (prod only; e.g. ".fworld.com").
      cookieDomain: process.env.COOKIE_DOMAIN ?? undefined,
      // Google OAuth — enabled only when both credentials are present.
      google:
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
          ? {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            }
          : undefined,
      session: {
        // Absolute maximum lifetime (ms), enforced on top of sliding sessions.
        absoluteMaxMs: Number(process.env.SESSION_ABSOLUTE_MAX_DAYS ?? 30) * 24 * 60 * 60 * 1000,
      },
      rateLimit: {
        enabled: process.env.AUTH_RATE_LIMIT_ENABLED !== 'false',
        window: Number(process.env.AUTH_RATE_LIMIT_WINDOW_SECONDS ?? 60),
        max: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 100),
        sensitiveMax: Number(process.env.AUTH_RATE_LIMIT_SENSITIVE_MAX ?? 20),
      },
    },
    payments: {
      // Razorpay — configured only when both credentials are present.
      razorpay:
        process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
          ? {
              keyId: process.env.RAZORPAY_KEY_ID,
              keySecret: process.env.RAZORPAY_KEY_SECRET,
              webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? undefined,
            }
          : undefined,
    },
    // Redis-backed cache. Active only when a Redis host is configured and caching
    // is not explicitly disabled; otherwise the cache service is a no-op and
    // callers fall back to the database transparently.
    cache: {
      enabled: Boolean(process.env.REDIS_HOST) && process.env.CACHE_ENABLED !== 'false',
      redis: process.env.REDIS_HOST
        ? {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT ?? 6379),
            password: process.env.REDIS_PASSWORD ?? undefined,
          }
        : undefined,
    },
    search: {
      provider: process.env.SEARCH_PROVIDER ?? 'postgres',
    },
    jobs: {
      enabled: process.env.JOBS_ENABLED !== 'false',
    },
  };
};
