import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { WishlistRepository } from './wishlist.repository';
import { WishlistService } from './wishlist.service';

interface RepoMock {
  findManyByUser: ReturnType<typeof vi.fn>;
  findEntry: ReturnType<typeof vi.fn>;
  productStatus: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  deleteEntry: ReturnType<typeof vi.fn>;
}

const USER = 'user-1';
const PID = '01920000-0000-7000-8000-0000000000b1';

function makeService(): { service: WishlistService; repo: RepoMock } {
  const repo: RepoMock = {
    findManyByUser: vi.fn().mockResolvedValue([]),
    findEntry: vi.fn().mockResolvedValue(null),
    productStatus: vi.fn().mockResolvedValue('ACTIVE'),
    create: vi.fn().mockResolvedValue({ id: 'w1', userId: USER, productId: PID }),
    deleteEntry: vi.fn().mockResolvedValue(1),
  };
  return { service: new WishlistService(repo as unknown as WishlistRepository), repo };
}

describe('WishlistService', () => {
  it('adds an active product', async () => {
    const { service, repo } = makeService();
    await service.add(USER, { productId: PID });
    expect(repo.create).toHaveBeenCalledWith(USER, PID);
  });

  it('rejects a missing product (422 PRODUCT_NOT_FOUND)', async () => {
    const { service, repo } = makeService();
    repo.productStatus.mockResolvedValue(null);
    await expect(service.add(USER, { productId: PID })).rejects.toMatchObject({
      response: { code: 'PRODUCT_NOT_FOUND' },
    });
  });

  it('rejects an inactive product (422 PRODUCT_NOT_ACTIVE)', async () => {
    const { service, repo } = makeService();
    repo.productStatus.mockResolvedValue('DRAFT');
    await expect(service.add(USER, { productId: PID })).rejects.toMatchObject({
      response: { code: 'PRODUCT_NOT_ACTIVE' },
    });
  });

  it('returns the existing entry on a duplicate add (no new row)', async () => {
    const { service, repo } = makeService();
    repo.findEntry.mockResolvedValue({ id: 'existing', userId: USER, productId: PID });
    const result = await service.add(USER, { productId: PID });
    expect(result).toMatchObject({ id: 'existing' });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('removes an entry', async () => {
    const { service, repo } = makeService();
    await expect(service.remove(USER, PID)).resolves.toEqual({ productId: PID });
    expect(repo.deleteEntry).toHaveBeenCalledWith(USER, PID);
  });

  it('returns 404 when removing a product not in the wishlist', async () => {
    const { service, repo } = makeService();
    repo.deleteEntry.mockResolvedValue(0);
    await expect(service.remove(USER, PID)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 for a non-UUID product id on remove', async () => {
    const { service, repo } = makeService();
    await expect(service.remove(USER, 'nope')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.deleteEntry).not.toHaveBeenCalled();
  });
});
