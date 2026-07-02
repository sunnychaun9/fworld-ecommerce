import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { StorefrontRepository } from './storefront.repository';
import { computeInStock, discountPercentage, StorefrontService } from './storefront.service';

interface RepoMock {
  listAndCount: ReturnType<typeof vi.fn>;
  listFeatured: ReturnType<typeof vi.fn>;
  listNewArrivals: ReturnType<typeof vi.fn>;
  listBestSellers: ReturnType<typeof vi.fn>;
  listActiveCollections: ReturnType<typeof vi.fn>;
  findActiveProductBySlug: ReturnType<typeof vi.fn>;
  findCollectionBySlug: ReturnType<typeof vi.fn>;
  listCollectionActiveProducts: ReturnType<typeof vi.fn>;
  findCategoryBySlug: ReturnType<typeof vi.fn>;
}

const PID = '01920000-0000-7000-8000-00000000d001';
const CATID = '01920000-0000-7000-8000-00000000d002';

function cardRow(overrides: Record<string, unknown> = {}) {
  return {
    id: PID,
    slug: 'tee',
    name: 'Tee',
    mrp: 1000,
    sellingPrice: 800,
    brand: null,
    images: [],
    variants: [{ id: 'v', inventory: { availableStock: 5 } }],
    ...overrides,
  };
}

function makeService(): { service: StorefrontService; repo: RepoMock } {
  const repo: RepoMock = {
    listAndCount: vi.fn().mockResolvedValue([[], 0]),
    listFeatured: vi.fn().mockResolvedValue([]),
    listNewArrivals: vi.fn().mockResolvedValue([]),
    listBestSellers: vi.fn().mockResolvedValue([]),
    listActiveCollections: vi.fn().mockResolvedValue([]),
    findActiveProductBySlug: vi.fn(),
    findCollectionBySlug: vi.fn(),
    listCollectionActiveProducts: vi.fn().mockResolvedValue([]),
    findCategoryBySlug: vi.fn(),
  };
  return { service: new StorefrontService(repo as unknown as StorefrontRepository), repo };
}

describe('discountPercentage', () => {
  it('computes the rounded percentage', () => {
    expect(discountPercentage(1000, 800)).toBe(20);
  });
  it('is 0 when there is no discount', () => {
    expect(discountPercentage(1000, 1000)).toBe(0);
    expect(discountPercentage(1000, 1200)).toBe(0);
    expect(discountPercentage(0, 0)).toBe(0);
  });
});

describe('computeInStock', () => {
  it('is true when any variant has available stock', () => {
    expect(computeInStock([{ inventory: { availableStock: 5 } }])).toBe(true);
  });
  it('is false when inventory is missing or zero', () => {
    expect(computeInStock([{ inventory: null }])).toBe(false);
    expect(computeInStock([{ inventory: { availableStock: 0 } }])).toBe(false);
    expect(computeInStock([])).toBe(false);
  });
});

describe('StorefrontService', () => {
  it('returns the four home sections with computed cards', async () => {
    const { service, repo } = makeService();
    repo.listFeatured.mockResolvedValue([cardRow()]);
    repo.listActiveCollections.mockResolvedValue([{ id: 'c', slug: 'edit' }]);
    const home = await service.getHome();
    expect(home.featured[0]).toMatchObject({ inStock: true, discountPercentage: 20 });
    expect(home.featured[0]).not.toHaveProperty('variants');
    expect(home.collections).toEqual([{ id: 'c', slug: 'edit' }]);
    expect(repo.listFeatured).toHaveBeenCalledWith(12);
  });

  it('lists products with computed cards and pagination', async () => {
    const { service, repo } = makeService();
    repo.listAndCount.mockResolvedValue([[cardRow()], 1]);
    const result = await service.listProducts({ page: 1, limit: 20 });
    expect(result.items[0]).toMatchObject({ inStock: true, discountPercentage: 20 });
    expect(result.pageInfo.total).toBe(1);
  });

  it('translates filters and sort/pagination to the repository', async () => {
    const { service, repo } = makeService();
    await service.listProducts({
      page: 2,
      limit: 10,
      featured: 'true',
      sort: 'priceAsc',
      inStock: 'true',
    });
    const [filters, sort, skip, take] = repo.listAndCount.mock.calls[0] ?? [];
    expect(filters).toMatchObject({ featured: true, inStock: true });
    expect(sort).toBe('priceAsc');
    expect(skip).toBe(10);
    expect(take).toBe(10);
  });

  it('returns product details with mapped collections and computed fields', async () => {
    const { service, repo } = makeService();
    repo.findActiveProductBySlug.mockResolvedValue({
      id: PID,
      slug: 'tee',
      mrp: 1000,
      sellingPrice: 800,
      brand: null,
      category: null,
      images: [],
      variants: [{ inventory: { availableStock: 0 } }],
      collections: [{ collection: { id: 'c', name: 'Edit' } }],
    });
    const details = await service.getProductBySlug('tee');
    expect(details.collections).toEqual([{ id: 'c', name: 'Edit' }]);
    expect(details.inStock).toBe(false);
    expect(details.discountPercentage).toBe(20);
  });

  it('hides inactive/missing products (404)', async () => {
    const { service, repo } = makeService();
    repo.findActiveProductBySlug.mockResolvedValue(null);
    await expect(service.getProductBySlug('draft')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('looks up a collection by slug (404 when missing)', async () => {
    const { service, repo } = makeService();
    repo.findCollectionBySlug.mockResolvedValue(null);
    await expect(service.getCollectionBySlug('nope')).rejects.toBeInstanceOf(NotFoundException);

    repo.findCollectionBySlug.mockResolvedValue({ id: 'c', slug: 'edit' });
    repo.listCollectionActiveProducts.mockResolvedValue([cardRow()]);
    const result = await service.getCollectionBySlug('edit');
    expect(result.collection).toEqual({ id: 'c', slug: 'edit' });
    expect(result.products[0]).toMatchObject({ inStock: true });
  });

  it('looks up a category by slug and scopes products to it (404 when missing)', async () => {
    const { service, repo } = makeService();
    repo.findCategoryBySlug.mockResolvedValue(null);
    await expect(service.getCategoryBySlug('nope', {})).rejects.toBeInstanceOf(NotFoundException);

    repo.findCategoryBySlug.mockResolvedValue({ id: CATID, slug: 'shirts' });
    repo.listAndCount.mockResolvedValue([[cardRow()], 1]);
    const result = await service.getCategoryBySlug('shirts', {});
    expect(result.category).toMatchObject({ id: CATID });
    expect(repo.listAndCount.mock.calls[0]?.[0]).toMatchObject({ categoryId: CATID });
  });
});
