import type { ConfigService } from '@nestjs/config';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';

interface RateLimitConfig {
  ttl: number;
  limit: number;
}

/**
 * Builds global rate-limiter options from validated configuration
 * (`RATE_LIMIT_TTL` / `RATE_LIMIT_LIMIT`). Extracted so it can be unit-tested.
 */
export function buildThrottlerOptions(config: ConfigService): ThrottlerModuleOptions {
  const rateLimit = config.get<RateLimitConfig>('rateLimit');
  return [{ ttl: rateLimit?.ttl ?? 60_000, limit: rateLimit?.limit ?? 100 }];
}
