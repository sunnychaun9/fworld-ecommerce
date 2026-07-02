import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type Redis from 'ioredis';

import { CACHE_PREFIX, InvalidationGroup, REDIS_CLIENT } from './cache.constants';

/**
 * Redis-backed cache. Every operation is best-effort: when Redis is absent or a
 * command fails, reads report a miss and writes are dropped, so callers
 * transparently fall back to the database. Exposes domain invalidation methods.
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis | null) {}

  isEnabled(): boolean {
    return this.client !== null;
  }

  /** Liveness probe for the Redis connection (false when disabled or unreachable). */
  async ping(): Promise<boolean> {
    if (!this.client) {
      return false;
    }
    try {
      return (await this.client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) {
      return null;
    }
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      this.logger.warn(`Cache get failed (${key}): ${String(error)}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.client) {
      return;
    }
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(`Cache set failed (${key}): ${String(error)}`);
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!this.client || keys.length === 0) {
      return;
    }
    try {
      await this.client.del(...keys);
    } catch (error) {
      this.logger.warn(`Cache del failed: ${String(error)}`);
    }
  }

  /** Delete every key whose name starts with `prefix` (SCAN-based). */
  async delByPrefix(prefix: string): Promise<void> {
    const client = this.client;
    if (!client) {
      return;
    }
    await new Promise<void>((resolve) => {
      const keys: string[] = [];
      const stream = client.scanStream({ match: `${prefix}*`, count: 100 });
      stream.on('data', (batch: string[]) => keys.push(...batch));
      stream.on('end', () => {
        (keys.length > 0 ? client.del(...keys) : Promise.resolve(0)).then(
          () => resolve(),
          () => resolve(),
        );
      });
      stream.on('error', () => resolve());
    });
  }

  async invalidate(group: InvalidationGroup): Promise<void> {
    await this.delByPrefixes(GROUP_PREFIXES[group]);
  }

  invalidateProducts(): Promise<void> {
    return this.invalidate('products');
  }

  invalidateCategories(): Promise<void> {
    return this.invalidate('categories');
  }

  invalidateCollections(): Promise<void> {
    return this.invalidate('collections');
  }

  invalidateInventory(): Promise<void> {
    return this.invalidate('inventory');
  }

  invalidateOrders(): Promise<void> {
    return this.invalidate('orders');
  }

  onModuleDestroy(): void {
    if (this.client) {
      void this.client.quit().catch(() => undefined);
    }
  }

  private async delByPrefixes(prefixes: string[]): Promise<void> {
    await Promise.all(prefixes.map((prefix) => this.delByPrefix(prefix)));
  }
}

/** Key prefixes cleared for each invalidation group (`categor`/`collection` cover both singular+plural). */
const GROUP_PREFIXES: Record<InvalidationGroup, string[]> = {
  products: [
    `${CACHE_PREFIX}:product`,
    `${CACHE_PREFIX}:home`,
    `${CACHE_PREFIX}:collection`,
    `${CACHE_PREFIX}:categor`,
    `${CACHE_PREFIX}:dashboard`,
  ],
  categories: [`${CACHE_PREFIX}:categor`, `${CACHE_PREFIX}:home`],
  collections: [`${CACHE_PREFIX}:collection`, `${CACHE_PREFIX}:home`],
  inventory: [`${CACHE_PREFIX}:dashboard`, `${CACHE_PREFIX}:product`, `${CACHE_PREFIX}:home`],
  orders: [`${CACHE_PREFIX}:dashboard`],
};
