import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { ProductsRepository } from './products.repository';
import { ProductsService, slugify } from './products.service';

interface RepoMock {
  create: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  findBySlug: ReturnType<typeof vi.fn>;
  slugExists: ReturnType<typeof vi.fn>;
  categoryExists: ReturnType<typeof vi.fn>;
  brandExists: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  listAndCount: ReturnType<typeof vi.fn>;
}

function makeService(): { service: ProductsService; repo: RepoMock } {
  const repo: RepoMock = {
    create: vi.fn().mockResolvedValue({ id: 'x' }),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    slugExists: vi.fn().mockResolvedValue(false),
    categoryExists: vi.fn().mockResolvedValue(true),
    brandExists: vi.fn().mockResolvedValue(true),
    update: vi.fn().mockResolvedValue({ id: 'x' }),
    delete: vi.fn(),
    listAndCount: vi.fn(),
  };
  return { service: new ProductsService(repo as unknown as ProductsRepository), repo };
}

const CID = '01920000-0000-7000-8000-0000000000c1';
const BID = '01920000-0000-7000-8000-0000000000b1';
const ID = '01920000-0000-7000-8000-0000000000a1';

function baseCreate(overrides: Record<string, unknown> = {}) {
  return { name: 'Shirt', categoryId: CID, mrp: 1000, sellingPrice: 800, ...overrides };
}

describe('slugify', () => {
  it('lowercases, trims, and hyphenates', () => {
    expect(slugify('  Linen  Shirt! ')).toBe('linen-shirt');
  });
});

describe('ProductsService', () => {
  it('generates a slug from the name and a UUID v7 id on create', async () => {
    const { service, repo } = makeService();
    await service.create(baseCreate());
    const arg = repo.create.mock.calls[0]?.[0] as { slug: string; id: string };
    expect(arg.slug).toBe('shirt');
    expect(arg.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab]/i);
  });

  it('auto-suffixes a generated slug when the base is taken (shirt → shirt-2)', async () => {
    const { service, repo } = makeService();
    repo.slugExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await service.create(baseCreate());
    const arg = repo.create.mock.calls[0]?.[0] as { slug: string };
    expect(arg.slug).toBe('shirt-2');
  });

  it('rejects an explicit slug that is already taken (409 SLUG_TAKEN)', async () => {
    const { service, repo } = makeService();
    repo.slugExists.mockResolvedValue(true);
    await expect(service.create(baseCreate({ slug: 'shirt' }))).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('rejects a create referencing a missing category (422 CATEGORY_NOT_FOUND)', async () => {
    const { service, repo } = makeService();
    repo.categoryExists.mockResolvedValue(false);
    await expect(service.create(baseCreate())).rejects.toMatchObject({
      response: { code: 'CATEGORY_NOT_FOUND' },
    });
  });

  it('rejects a create referencing a missing brand (422 BRAND_NOT_FOUND)', async () => {
    const { service, repo } = makeService();
    repo.brandExists.mockResolvedValue(false);
    await expect(service.create(baseCreate({ brandId: BID }))).rejects.toMatchObject({
      response: { code: 'BRAND_NOT_FOUND' },
    });
  });

  it('rejects sellingPrice greater than MRP (422 SELLING_PRICE_EXCEEDS_MRP)', async () => {
    const { service } = makeService();
    await expect(
      service.create(baseCreate({ mrp: 1000, sellingPrice: 1200 })),
    ).rejects.toMatchObject({ response: { code: 'SELLING_PRICE_EXCEEDS_MRP' } });
  });

  it('blocks publishing (ACTIVE) without required fields (422 PRODUCT_PUBLISH_INVALID)', async () => {
    const { service } = makeService();
    await expect(
      service.create(baseCreate({ status: 'ACTIVE' })), // no description
    ).rejects.toMatchObject({ response: { code: 'PRODUCT_PUBLISH_INVALID' } });
  });

  it('allows publishing (ACTIVE) when all requirements are met', async () => {
    const { service, repo } = makeService();
    await service.create(baseCreate({ status: 'ACTIVE', description: 'A great shirt' }));
    expect(repo.create).toHaveBeenCalled();
  });

  it('updates a product', async () => {
    const { service, repo } = makeService();
    repo.findById.mockResolvedValue({
      id: ID,
      name: 'Shirt',
      description: 'x',
      mrp: 1000,
      sellingPrice: 800,
      status: 'DRAFT',
      categoryId: CID,
    });
    await service.update(ID, { sellingPrice: 700 });
    expect(repo.update).toHaveBeenCalledWith(ID, { sellingPrice: 700 });
  });

  it('rejects an update that makes sellingPrice exceed MRP (422)', async () => {
    const { service, repo } = makeService();
    repo.findById.mockResolvedValue({ id: ID, mrp: 1000, sellingPrice: 800, status: 'DRAFT' });
    await expect(service.update(ID, { sellingPrice: 5000 })).rejects.toMatchObject({
      response: { code: 'SELLING_PRICE_EXCEEDS_MRP' },
    });
  });

  it('deletes a product', async () => {
    const { service, repo } = makeService();
    repo.findById.mockResolvedValue({ id: ID });
    await expect(service.remove(ID)).resolves.toEqual({ id: ID });
    expect(repo.delete).toHaveBeenCalledWith(ID);
  });

  it('returns 404 for a non-UUID id without hitting the database', async () => {
    const { service, repo } = makeService();
    await expect(service.getById('nope')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('returns a product by slug', async () => {
    const { service, repo } = makeService();
    repo.findBySlug.mockResolvedValue({ id: ID, slug: 'shirt' });
    await expect(service.getBySlug('shirt')).resolves.toMatchObject({ slug: 'shirt' });
  });
});
