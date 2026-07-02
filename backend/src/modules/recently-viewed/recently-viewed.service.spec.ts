import { describe, expect, it, vi } from 'vitest';

import { RecentlyViewedRepository } from './recently-viewed.repository';
import { RecentlyViewedService } from './recently-viewed.service';

interface RepoMock {
  findManyByUser: ReturnType<typeof vi.fn>;
  productStatus: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  pruneToLimit: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
}

const USER = 'user-1';
const PID = '01920000-0000-7000-8000-0000000000d1';

function makeService(): { service: RecentlyViewedService; repo: RepoMock } {
  const repo: RepoMock = {
    findManyByUser: vi.fn().mockResolvedValue([]),
    productStatus: vi.fn().mockResolvedValue('ACTIVE'),
    upsert: vi.fn().mockResolvedValue({ id: 'rv1' }),
    pruneToLimit: vi.fn(),
    clear: vi.fn(),
  };
  return { service: new RecentlyViewedService(repo as unknown as RecentlyViewedRepository), repo };
}

describe('RecentlyViewedService', () => {
  it('records a view (refreshing timestamp) and prunes to the 50-entry limit', async () => {
    const { service, repo } = makeService();
    await service.record(USER, PID);
    expect(repo.upsert).toHaveBeenCalledWith(USER, PID, expect.any(Date));
    expect(repo.pruneToLimit).toHaveBeenCalledWith(USER, 50);
  });

  it('rejects a missing product (422 PRODUCT_NOT_FOUND)', async () => {
    const { service, repo } = makeService();
    repo.productStatus.mockResolvedValue(null);
    await expect(service.record(USER, PID)).rejects.toMatchObject({
      response: { code: 'PRODUCT_NOT_FOUND' },
    });
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('rejects an inactive product (422 PRODUCT_NOT_ACTIVE)', async () => {
    const { service, repo } = makeService();
    repo.productStatus.mockResolvedValue('DRAFT');
    await expect(service.record(USER, PID)).rejects.toMatchObject({
      response: { code: 'PRODUCT_NOT_ACTIVE' },
    });
  });

  it('rejects a non-UUID product id without a lookup', async () => {
    const { service, repo } = makeService();
    await expect(service.record(USER, 'nope')).rejects.toMatchObject({
      response: { code: 'PRODUCT_NOT_FOUND' },
    });
    expect(repo.productStatus).not.toHaveBeenCalled();
  });

  it('clears all entries', async () => {
    const { service, repo } = makeService();
    await expect(service.clear(USER)).resolves.toEqual({ cleared: true });
    expect(repo.clear).toHaveBeenCalledWith(USER);
  });
});
