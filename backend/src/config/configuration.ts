/**
 * Typed configuration factory consumed by `@nestjs/config`.
 * Values are read from environment variables (see root `.env.example`).
 */
export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  redis: {
    url: process.env.REDIS_URL ?? '',
  },
  meilisearch: {
    host: process.env.MEILISEARCH_HOST ?? '',
    masterKey: process.env.MEILISEARCH_MASTER_KEY ?? '',
  },
});
