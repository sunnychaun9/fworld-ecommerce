import { NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it, vi } from 'vitest';

import { CollectionsService, slugify } from './collections.service';
import type { CollectionsRepository } from './collections.repository';
import { AddProductsDto } from './dto/add-products.dto';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { ReorderProductsDto } from './dto/reorder-products.dto';

interface RepoMock {
  create: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  findBySlug: ReturnType<typeof vi.fn>;
  exists: ReturnType<typeof vi.fn>;
  slugExists: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  listAndCount: ReturnType<typeof vi.fn>;
  productExists: ReturnType<typeof vi.fn>;
  collectionProductExists: ReturnType<typeof vi.fn>;
  addProducts: ReturnType<typeof vi.fn>;
  removeProduct: ReturnType<typeof vi.fn>;
  listProducts: ReturnType<typeof vi.fn>;
  reorder: ReturnType<typeof vi.fn>;
}

const CID = '01920000-0000-7000-8000-00000000c101';
const PID = '01920000-0000-7000-8000-00000000c102';

function makeService(): { service: CollectionsService; repo: RepoMock } {
  const repo: RepoMock = {
    create: vi.fn().mockResolvedValue({ id: CID }),
    findById: vi.fn().mockResolvedValue({ id: CID }),
    findBySlug: vi.fn(),
    exists: vi.fn().mockResolvedValue(true),
    slugExists: vi.fn().mockResolvedValue(false),
    update: vi.fn().mockResolvedValue({ id: CID }),
    delete: vi.fn(),
    listAndCount: vi.fn().mockResolvedValue([[], 0]),
    productExists: vi.fn().mockResolvedValue(true),
    collectionProductExists: vi.fn().mockResolvedValue(false),
    addProducts: vi.fn().mockResolvedValue({ count: 1 }),
    removeProduct: vi.fn().mockResolvedValue(1),
    listProducts: vi.fn().mockResolvedValue([]),
    reorder: vi.fn().mockResolvedValue([]),
  };
  return { service: new CollectionsService(repo as unknown as CollectionsRepository), repo };
}

describe('slugify', () => {
  it('lowercases, trims, and hyphenates', () => {
    expect(slugify('  Summer  Edit! ')).toBe('summer-edit');
  });
});

describe('CollectionsService', () => {
  it('generates a slug and a UUID v7 id on create', async () => {
    const { service, repo } = makeService();
    await service.create({ name: 'Summer' });
    const arg = repo.create.mock.calls[0]?.[0] as { slug: string; id: string };
    expect(arg.slug).toBe('summer');
    expect(arg.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab]/i);
  });

  it('auto-suffixes a generated slug when the base is taken (summer → summer-2)', async () => {
    const { service, repo } = makeService();
    repo.slugExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await service.create({ name: 'Summer' });
    const arg = repo.create.mock.calls[0]?.[0] as { slug: string };
    expect(arg.slug).toBe('summer-2');
  });

  it('rejects an explicit slug that is already taken (409 SLUG_TAKEN)', async () => {
    const { service, repo } = makeService();
    repo.slugExists.mockResolvedValue(true);
    await expect(service.create({ name: 'Summer', slug: 'summer' })).rejects.toMatchObject({
      response: { code: 'SLUG_TAKEN' },
    });
  });

  it('updates a collection', async () => {
    const { service, repo } = makeService();
    await service.update(CID, { description: 'Hot picks' });
    expect(repo.update).toHaveBeenCalledWith(CID, { description: 'Hot picks' });
  });

  it('deletes a collection (join rows only)', async () => {
    const { service, repo } = makeService();
    await expect(service.remove(CID)).resolves.toEqual({ id: CID });
    expect(repo.delete).toHaveBeenCalledWith(CID);
  });

  it('adds products to a collection', async () => {
    const { service, repo } = makeService();
    await service.addProducts(CID, { productIds: [PID] });
    expect(repo.addProducts).toHaveBeenCalledWith(CID, [PID]);
  });

  it('rejects adding to a missing collection (422 COLLECTION_NOT_FOUND)', async () => {
    const { service, repo } = makeService();
    repo.exists.mockResolvedValue(false);
    await expect(service.addProducts(CID, { productIds: [PID] })).rejects.toMatchObject({
      response: { code: 'COLLECTION_NOT_FOUND' },
    });
  });

  it('rejects adding a missing product (422 PRODUCT_NOT_FOUND)', async () => {
    const { service, repo } = makeService();
    repo.productExists.mockResolvedValue(false);
    await expect(service.addProducts(CID, { productIds: [PID] })).rejects.toMatchObject({
      response: { code: 'PRODUCT_NOT_FOUND' },
    });
  });

  it('rejects adding a duplicate product (409 PRODUCT_ALREADY_IN_COLLECTION)', async () => {
    const { service, repo } = makeService();
    repo.collectionProductExists.mockResolvedValue(true);
    await expect(service.addProducts(CID, { productIds: [PID] })).rejects.toMatchObject({
      response: { code: 'PRODUCT_ALREADY_IN_COLLECTION' },
    });
    expect(repo.addProducts).not.toHaveBeenCalled();
  });

  it('removes a product from a collection', async () => {
    const { service, repo } = makeService();
    await expect(service.removeProduct(CID, PID)).resolves.toEqual({
      collectionId: CID,
      productId: PID,
    });
    expect(repo.removeProduct).toHaveBeenCalledWith(CID, PID);
  });

  it('returns 404 when removing a product not in the collection', async () => {
    const { service, repo } = makeService();
    repo.removeProduct.mockResolvedValue(0);
    await expect(service.removeProduct(CID, PID)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reorders products', async () => {
    const { service, repo } = makeService();
    await service.reorderProducts(CID, { items: [{ productId: PID, sortOrder: 3 }] });
    expect(repo.reorder).toHaveBeenCalledWith(CID, [{ productId: PID, sortOrder: 3 }]);
  });

  it('maps collection products with their sortOrder on listing', async () => {
    const { service, repo } = makeService();
    repo.listProducts.mockResolvedValue([{ sortOrder: 5, product: { id: PID, name: 'Tee' } }]);
    await expect(service.listProducts(CID)).resolves.toEqual([
      { id: PID, name: 'Tee', sortOrder: 5 },
    ]);
  });

  it('lists collections with pagination', async () => {
    const { service, repo } = makeService();
    repo.listAndCount.mockResolvedValue([[{ id: CID }], 1]);
    const result = await service.list({ page: 1, limit: 20 });
    expect(result.pageInfo.total).toBe(1);
  });

  it('returns 404 for a non-UUID id without hitting the database', async () => {
    const { service, repo } = makeService();
    await expect(service.getById('nope')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.findById).not.toHaveBeenCalled();
  });
});

describe('Collection DTOs', () => {
  it('requires a collection name', async () => {
    const dto = plainToInstance(CreateCollectionDto, {});
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejects an invalid image URL', async () => {
    const dto = plainToInstance(CreateCollectionDto, { name: 'X', image: 'not a url' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'image')).toBe(true);
  });

  it('rejects an empty products array', async () => {
    const dto = plainToInstance(AddProductsDto, { productIds: [] });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'productIds')).toBe(true);
  });

  it('rejects an empty reorder items array', async () => {
    const dto = plainToInstance(ReorderProductsDto, { items: [] });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'items')).toBe(true);
  });
});
