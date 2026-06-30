/**
 * Typed configuration factory consumed by `@nestjs/config`.
 * Values are read from environment variables validated by `env.validation.ts`.
 * Integration-specific config (payments, shipping, storage, search) is added in
 * the sprint that introduces it.
 */
export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  rateLimit: {
    ttl: Number(process.env.RATE_LIMIT_TTL ?? 60_000),
    limit: Number(process.env.RATE_LIMIT_LIMIT ?? 100),
  },
});
