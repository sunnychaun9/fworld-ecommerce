import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface CacheConfig {
  enabled: boolean;
  redis?: { host: string; port: number; password?: string };
}

/**
 * Builds the Redis client, or returns `null` when caching is disabled / Redis is
 * not configured. A null client makes {@link CacheService} a transparent no-op so
 * callers fall back to the database. Connection failures never crash startup.
 */
export function createRedisClient(config: ConfigService): Redis | null {
  const cache = config.get<CacheConfig>('cache');
  if (!cache?.enabled || !cache.redis) {
    return null;
  }

  const logger = new Logger('RedisClient');
  const client = new Redis({
    host: cache.redis.host,
    port: cache.redis.port,
    password: cache.redis.password,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy: () => null,
  });
  client.on('error', (error) => logger.warn(`Redis error: ${error.message}`));
  client.connect().catch((error: unknown) => {
    logger.warn(`Redis connection failed; caching disabled: ${String(error)}`);
  });
  return client;
}
