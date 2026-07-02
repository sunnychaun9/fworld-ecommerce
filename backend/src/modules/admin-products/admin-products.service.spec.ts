import { UnprocessableEntityException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { AdminProductsRepository } from './admin-products.repository';
import { AdminProductsService } from './admin-products.service';

interface RepoMock {
  updateStatus: ReturnType<typeof vi.fn>;
  updateFlags: ReturnType<typeof vi.fn>;
}

const IDS = ['01920000-0000-7000-8000-0000000000a1', '01920000-0000-7000-8000-0000000000a2'];

function makeService(): { service: AdminProductsService; repo: RepoMock } {
  const repo: RepoMock = {
    updateStatus: vi.fn().mockResolvedValue(2),
    updateFlags: vi.fn().mockResolvedValue(2),
  };
  return { service: new AdminProductsService(repo as unknown as AdminProductsRepository), repo };
}

describe('AdminProductsService', () => {
  it('bulk-updates status and returns the affected count', async () => {
    const { service, repo } = makeService();
    const result = await service.setStatus({ productIds: IDS, status: 'ACTIVE' });
    expect(repo.updateStatus).toHaveBeenCalledWith(IDS, 'ACTIVE');
    expect(result).toEqual({ affected: 2 });
  });

  it('applies only the provided merchandising flags', async () => {
    const { service, repo } = makeService();
    await service.setFeatured({ productIds: IDS, featured: true, bestSeller: false });
    expect(repo.updateFlags).toHaveBeenCalledWith(IDS, { featured: true, bestSeller: false });
  });

  it('rejects a featured update with no flags (422)', async () => {
    const { service, repo } = makeService();
    await expect(service.setFeatured({ productIds: IDS })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(repo.updateFlags).not.toHaveBeenCalled();
  });

  it('soft-deletes to ARCHIVED and restores to DRAFT', async () => {
    const { service, repo } = makeService();
    await service.softDelete({ productIds: IDS });
    expect(repo.updateStatus).toHaveBeenCalledWith(IDS, 'ARCHIVED');
    await service.restore({ productIds: IDS });
    expect(repo.updateStatus).toHaveBeenCalledWith(IDS, 'DRAFT');
  });
});
