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
  };
};
