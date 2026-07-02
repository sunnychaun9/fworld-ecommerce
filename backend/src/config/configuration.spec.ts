import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import configuration from './configuration';

const KEYS = [
  'REDIS_HOST',
  'REDIS_PORT',
  'CACHE_ENABLED',
  'SEARCH_PROVIDER',
  'JOBS_ENABLED',
  'RATE_LIMIT_TTL',
  'RATE_LIMIT_LIMIT',
];

describe('configuration factory', () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
    KEYS.forEach((k) => delete process.env[k]);
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it('disables the cache when no Redis host is configured', () => {
    const config = configuration();
    expect(config.cache.enabled).toBe(false);
    expect(config.cache.redis).toBeUndefined();
    expect(config.search.provider).toBe('postgres');
    expect(config.jobs.enabled).toBe(true);
  });

  it('enables the cache when a Redis host is present', () => {
    process.env.REDIS_HOST = 'redis';
    process.env.REDIS_PORT = '6380';
    const config = configuration();
    expect(config.cache.enabled).toBe(true);
    expect(config.cache.redis).toMatchObject({ host: 'redis', port: 6380 });
  });

  it('honours CACHE_ENABLED=false even with a Redis host', () => {
    process.env.REDIS_HOST = 'redis';
    process.env.CACHE_ENABLED = 'false';
    expect(configuration().cache.enabled).toBe(false);
  });

  it('reads rate-limit values and a version', () => {
    process.env.RATE_LIMIT_TTL = '30000';
    process.env.RATE_LIMIT_LIMIT = '50';
    const config = configuration();
    expect(config.rateLimit).toEqual({ ttl: 30000, limit: 50 });
    expect(typeof config.version).toBe('string');
  });
});
