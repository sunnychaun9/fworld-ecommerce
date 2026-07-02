import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';

import { CacheService } from '../cache/cache.service';
import { JobsRepository } from './jobs.repository';
import { JobsService } from './jobs.service';

interface RepoMock {
  deleteExpiredCoupons: ReturnType<typeof vi.fn>;
  deleteExpiredNotifications: ReturnType<typeof vi.fn>;
  deleteAbandonedCarts: ReturnType<typeof vi.fn>;
  deleteExpiredPendingPayments: ReturnType<typeof vi.fn>;
}

function makeService(enabled = true): {
  service: JobsService;
  repo: RepoMock;
  cache: { invalidateProducts: ReturnType<typeof vi.fn> };
} {
  const repo: RepoMock = {
    deleteExpiredCoupons: vi.fn().mockResolvedValue(2),
    deleteExpiredNotifications: vi.fn().mockResolvedValue(3),
    deleteAbandonedCarts: vi.fn().mockResolvedValue(4),
    deleteExpiredPendingPayments: vi.fn().mockResolvedValue(5),
  };
  const cache = { invalidateProducts: vi.fn().mockResolvedValue(undefined) };
  const config = { get: vi.fn().mockReturnValue({ enabled }) } as unknown as ConfigService;
  const service = new JobsService(
    config,
    repo as unknown as JobsRepository,
    cache as unknown as CacheService,
  );
  return { service, repo, cache };
}

describe('JobsService (enabled)', () => {
  it('cleans up expired coupons with the current time', async () => {
    const { service, repo } = makeService();
    await expect(service.cleanupExpiredCoupons()).resolves.toBe(2);
    expect(repo.deleteExpiredCoupons).toHaveBeenCalledWith(expect.any(Date));
  });

  it('cleans up expired notifications using a cutoff', async () => {
    const { service, repo } = makeService();
    await expect(service.cleanupExpiredNotifications()).resolves.toBe(3);
    expect(repo.deleteExpiredNotifications).toHaveBeenCalledWith(expect.any(Date));
  });

  it('cleans up abandoned carts and expired pending payments', async () => {
    const { service, repo } = makeService();
    await expect(service.cleanupAbandonedCarts()).resolves.toBe(4);
    await expect(service.deleteExpiredPendingPayments()).resolves.toBe(5);
    expect(repo.deleteAbandonedCarts).toHaveBeenCalledWith(expect.any(Date));
    expect(repo.deleteExpiredPendingPayments).toHaveBeenCalledWith(expect.any(Date));
  });

  it('recomputes recommendation caches by clearing product caches', async () => {
    const { service, cache } = makeService();
    await service.recomputeRecommendationCaches();
    expect(cache.invalidateProducts).toHaveBeenCalled();
  });
});

describe('JobsService (disabled)', () => {
  it('does no work when JOBS_ENABLED is false', async () => {
    const { service, repo, cache } = makeService(false);
    await expect(service.cleanupExpiredCoupons()).resolves.toBe(0);
    await service.recomputeRecommendationCaches();
    expect(repo.deleteExpiredCoupons).not.toHaveBeenCalled();
    expect(cache.invalidateProducts).not.toHaveBeenCalled();
  });
});
