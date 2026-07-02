import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { CACHE_PREFIX, CACHE_TTL, InvalidationGroup } from './cache.constants';
import { CacheService } from './cache.service';

interface CacheReadConfig {
  prefix: string;
  ttl: number;
  param?: string;
  useQuery?: boolean;
}

/** Read routes served from cache, keyed by controller then handler name. */
const READ_ROUTES: Record<string, Record<string, CacheReadConfig>> = {
  StorefrontController: {
    home: { prefix: 'home', ttl: CACHE_TTL.HOME },
    productBySlug: { prefix: 'product', ttl: CACHE_TTL.PRODUCT, param: 'slug' },
    collectionBySlug: { prefix: 'collection', ttl: CACHE_TTL.COLLECTIONS, param: 'slug' },
    categoryBySlug: {
      prefix: 'category',
      ttl: CACHE_TTL.CATEGORIES,
      param: 'slug',
      useQuery: true,
    },
  },
  CategoriesController: {
    list: { prefix: 'categories', ttl: CACHE_TTL.CATEGORIES, useQuery: true },
  },
  CollectionsController: {
    list: { prefix: 'collections', ttl: CACHE_TTL.COLLECTIONS, useQuery: true },
  },
  DashboardController: {
    summary: { prefix: 'dashboard', ttl: CACHE_TTL.DASHBOARD },
  },
};

/** Write routes that invalidate a cache namespace on success. */
const INVALIDATION_ROUTES: Record<string, Record<string, InvalidationGroup>> = {
  ProductsController: { create: 'products', update: 'products', remove: 'products' },
  CategoriesController: { create: 'categories', update: 'categories', remove: 'categories' },
  CollectionsController: {
    create: 'collections',
    update: 'collections',
    remove: 'collections',
    addProducts: 'collections',
    removeProduct: 'collections',
    reorder: 'collections',
  },
  InventoryController: { create: 'inventory', update: 'inventory', remove: 'inventory' },
  AdminInventoryController: { adjust: 'inventory' },
  OrdersController: { create: 'orders' },
  AdminOrdersController: { updateStatus: 'orders' },
};

/**
 * Global cache interceptor. Serves whitelisted read routes from Redis and
 * invalidates namespaces after whitelisted writes — a cross-cutting concern, so
 * the cached feature modules are never modified. A no-op when caching is disabled.
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private readonly cache: CacheService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    if (!this.cache.isEnabled()) {
      return next.handle();
    }
    const controller = context.getClass().name;
    const handler = context.getHandler().name;

    const read = READ_ROUTES[controller]?.[handler];
    if (read) {
      const request = context.switchToHttp().getRequest<Request>();
      const key = this.buildKey(read, request);
      const cached = await this.cache.get(key);
      if (cached !== null) {
        return of(cached);
      }
      return next.handle().pipe(tap((data) => void this.cache.set(key, data, read.ttl)));
    }

    const group = INVALIDATION_ROUTES[controller]?.[handler];
    if (group) {
      return next.handle().pipe(tap(() => void this.cache.invalidate(group)));
    }

    return next.handle();
  }

  private buildKey(config: CacheReadConfig, request: Request): string {
    const parts = [CACHE_PREFIX, config.prefix];
    if (config.param) {
      parts.push(String(request.params?.[config.param] ?? ''));
    }
    if (config.useQuery) {
      parts.push(this.hashQuery(request.query));
    }
    return parts.join(':');
  }

  private hashQuery(query: unknown): string {
    if (!query || typeof query !== 'object') {
      return 'all';
    }
    const entries = Object.entries(query as Record<string, unknown>)
      .filter(([, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return entries.length > 0 ? entries.map(([k, v]) => `${k}=${String(v)}`).join('&') : 'all';
  }
}
