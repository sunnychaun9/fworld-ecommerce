import type Redis from 'ioredis';
import { describe, expect, it, vi } from 'vitest';

import { CacheService } from './cache.service';

function fakeClient(overrides: Record<string, unknown> = {}) {
  return {
    get: vi.fn(),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    quit: vi.fn().mockResolvedValue('OK'),
    ...overrides,
  } as unknown as Redis;
}

describe('CacheService (enabled)', () => {
  it('reports a hit and parses JSON', async () => {
    const client = fakeClient({ get: vi.fn().mockResolvedValue('{"x":1}') });
    const service = new CacheService(client);
    expect(service.isEnabled()).toBe(true);
    await expect(service.get<{ x: number }>('k')).resolves.toEqual({ x: 1 });
  });

  it('reports a miss when the key is absent', async () => {
    const client = fakeClient({ get: vi.fn().mockResolvedValue(null) });
    const service = new CacheService(client);
    await expect(service.get('k')).resolves.toBeNull();
  });

  it('writes with an expiry', async () => {
    const client = fakeClient();
    const service = new CacheService(client);
    await service.set('k', { a: 1 }, 120);
    expect(client.set).toHaveBeenCalledWith('k', '{"a":1}', 'EX', 120);
  });

  it('swallows Redis errors and reports a miss', async () => {
    const client = fakeClient({ get: vi.fn().mockRejectedValue(new Error('down')) });
    const service = new CacheService(client);
    await expect(service.get('k')).resolves.toBeNull();
  });
});

describe('CacheService (disabled / Redis absent)', () => {
  it('is a transparent no-op falling back to the database', async () => {
    const service = new CacheService(null);
    expect(service.isEnabled()).toBe(false);
    await expect(service.get('k')).resolves.toBeNull();
    await expect(service.set('k', 1, 60)).resolves.toBeUndefined();
    await expect(service.del('k')).resolves.toBeUndefined();
    await expect(service.invalidateProducts()).resolves.toBeUndefined();
  });
});
