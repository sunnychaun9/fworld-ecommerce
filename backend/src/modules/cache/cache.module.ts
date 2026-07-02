import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { REDIS_CLIENT } from './cache.constants';
import { CacheInterceptor } from './cache.interceptor';
import { CacheService } from './cache.service';
import { createRedisClient } from './redis.provider';

/**
 * Redis cache module. Global so {@link CacheService} is injectable anywhere, and
 * it registers a global {@link CacheInterceptor} that caches read-heavy routes
 * and invalidates on writes without modifying those feature modules. Falls back
 * to direct database access when Redis is unconfigured.
 */
@Global()
@Module({
  providers: [
    { provide: REDIS_CLIENT, useFactory: createRedisClient, inject: [ConfigService] },
    CacheService,
    { provide: APP_INTERCEPTOR, useClass: CacheInterceptor },
  ],
  exports: [CacheService],
})
export class CacheModule {}
