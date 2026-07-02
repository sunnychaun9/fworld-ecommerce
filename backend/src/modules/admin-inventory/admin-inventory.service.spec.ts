import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { AdminInventoryRepository } from './admin-inventory.repository';
import { AdminInventoryService } from './admin-inventory.service';

interface RepoMock {
  list: ReturnType<typeof vi.fn>;
  findByVariantId: ReturnType<typeof vi.fn>;
  lowStock: ReturnType<typeof vi.fn>;
  applyAdjustment: ReturnType<typeof vi.fn>;
}

const VID = '01920000-0000-7000-8000-0000000000b1';
const ADMIN = 'admin-1';

function makeService(available = 10): { service: AdminInventoryService; repo: RepoMock } {
  const repo: RepoMock = {
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    findByVariantId: vi
      .fn()
      .mockResolvedValue({ id: 'inv1', variantId: VID, availableStock: available }),
    lowStock: vi.fn().mockResolvedValue([]),
    applyAdjustment: vi.fn().mockResolvedValue({ inventory: {}, adjustment: {} }),
  };
  return { service: new AdminInventoryService(repo as unknown as AdminInventoryRepository), repo };
}

describe('AdminInventoryService.adjust', () => {
  it('increases stock and records the previous/new quantities', async () => {
    const { service, repo } = makeService(10);
    await service.adjust(
      { variantId: VID, type: 'INCREASE', quantity: 5, reason: 'restock' },
      ADMIN,
    );
    expect(repo.applyAdjustment).toHaveBeenCalledWith(
      expect.objectContaining({ previousQuantity: 10, newQuantity: 15, adjustedBy: ADMIN }),
    );
  });

  it('decreases stock within bounds', async () => {
    const { service, repo } = makeService(10);
    await service.adjust(
      { variantId: VID, type: 'DECREASE', quantity: 4, reason: 'damage' },
      ADMIN,
    );
    expect(repo.applyAdjustment).toHaveBeenCalledWith(expect.objectContaining({ newQuantity: 6 }));
  });

  it('rejects a decrease that would go negative (422 NEGATIVE_STOCK)', async () => {
    const { service, repo } = makeService(3);
    await expect(
      service.adjust({ variantId: VID, type: 'DECREASE', quantity: 5, reason: 'x' }, ADMIN),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(repo.applyAdjustment).not.toHaveBeenCalled();
  });

  it('returns 404 when the variant has no inventory', async () => {
    const { service, repo } = makeService();
    repo.findByVariantId.mockResolvedValue(null);
    await expect(
      service.adjust({ variantId: VID, type: 'INCREASE', quantity: 1, reason: 'x' }, ADMIN),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('AdminInventoryService.list', () => {
  it('returns a paginated envelope', async () => {
    const { service, repo } = makeService();
    repo.list.mockResolvedValue({ items: [{ id: 'inv1' }], total: 1 });
    const result = await service.list({ page: 2, pageSize: 10 });
    expect(repo.list).toHaveBeenCalledWith(10, 10);
    expect(result).toMatchObject({ total: 1, page: 2, pageSize: 10 });
  });
});
