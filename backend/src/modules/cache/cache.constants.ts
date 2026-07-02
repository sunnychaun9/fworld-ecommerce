/** DI token for the (possibly null) Redis client. */
export const REDIS_CLIENT = 'REDIS_CLIENT';

/** Root namespace for all cache keys. */
export const CACHE_PREFIX = 'cache';

/** Per-endpoint TTLs (seconds). */
export const CACHE_TTL = {
  HOME: 5 * 60,
  PRODUCT: 10 * 60,
  COLLECTIONS: 10 * 60,
  CATEGORIES: 5 * 60,
  DASHBOARD: 2 * 60,
} as const;

/** Cache namespaces affected by a domain change. */
export type InvalidationGroup = 'products' | 'categories' | 'collections' | 'inventory' | 'orders';
