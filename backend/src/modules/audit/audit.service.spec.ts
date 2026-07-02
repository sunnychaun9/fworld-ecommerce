import { describe, expect, it, vi } from 'vitest';

import { AuditRepository } from './audit.repository';
import { AuditService } from './audit.service';

interface RepoMock {
  create: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
}

function makeService(): { service: AuditService; repo: RepoMock } {
  const repo: RepoMock = {
    create: vi.fn().mockResolvedValue({ id: 'a1' }),
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  };
  return { service: new AuditService(repo as unknown as AuditRepository), repo };
}

describe('AuditService.record', () => {
  it('persists an audit entry', async () => {
    const { service, repo } = makeService();
    await service.record({
      actorId: 'admin-1',
      action: 'COUPON_CREATED',
      entity: 'COUPON',
      entityId: 'c1',
    });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'admin-1',
        action: 'COUPON_CREATED',
        entity: 'COUPON',
        entityId: 'c1',
      }),
    );
  });

  it('includes metadata when provided', async () => {
    const { service, repo } = makeService();
    await service.record({
      actorId: null,
      action: 'PRODUCTS_BULK_STATUS',
      entity: 'PRODUCT',
      metadata: { productIds: ['p1'] },
    });
    expect(repo.create.mock.calls[0]?.[0]).toMatchObject({ metadata: { productIds: ['p1'] } });
  });

  it('never throws when persistence fails (best-effort)', async () => {
    const { service, repo } = makeService();
    repo.create.mockRejectedValue(new Error('db down'));
    await expect(
      service.record({ actorId: null, action: 'X', entity: 'Y' }),
    ).resolves.toBeUndefined();
  });
});

describe('AuditService.list', () => {
  it('applies filters and returns a paginated envelope', async () => {
    const { service, repo } = makeService();
    repo.list.mockResolvedValue({ items: [{ id: 'a1' }], total: 1 });
    const result = await service.list({ entity: 'COUPON', page: 2, pageSize: 10 });
    expect(repo.list).toHaveBeenCalledWith({ entity: 'COUPON' }, 10, 10);
    expect(result).toMatchObject({ total: 1, page: 2, pageSize: 10 });
  });
});
