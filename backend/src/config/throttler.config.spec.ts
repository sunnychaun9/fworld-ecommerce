import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';

import { buildThrottlerOptions } from './throttler.config';

describe('buildThrottlerOptions', () => {
  it('uses configured rate-limit values', () => {
    const config = {
      get: vi.fn().mockReturnValue({ ttl: 30_000, limit: 50 }),
    } as unknown as ConfigService;
    expect(buildThrottlerOptions(config)).toEqual([{ ttl: 30_000, limit: 50 }]);
  });

  it('falls back to defaults when unconfigured', () => {
    const config = { get: vi.fn().mockReturnValue(undefined) } as unknown as ConfigService;
    expect(buildThrottlerOptions(config)).toEqual([{ ttl: 60_000, limit: 100 }]);
  });
});
