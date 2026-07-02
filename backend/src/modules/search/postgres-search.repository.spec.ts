import { describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../../database/prisma.service';
import { PostgresSearchRepository } from './postgres-search.repository';
import { ProductSearchQuery } from './product-search.provider';

function baseQuery(overrides: Partial<ProductSearchQuery> = {}): ProductSearchQuery {
  return { page: 1, limit: 20, sort: 'relevance', ...overrides };
}

describe('PostgresSearchRepository.buildWhere', () => {
  const repo = new PostgresSearchRepository({} as unknown as PrismaService);

  it('always restricts to ACTIVE products', () => {
    expect(repo.buildWhere(baseQuery()).status).toBe('ACTIVE');
  });

  it('searches name, slug, brand and category on q', () => {
    const where = repo.buildWhere(baseQuery({ q: 'shirt' }));
    expect(where.OR).toHaveLength(4);
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { name: { contains: 'shirt', mode: 'insensitive' } },
        { brand: { name: { contains: 'shirt', mode: 'insensitive' } } },
        { category: { name: { contains: 'shirt', mode: 'insensitive' } } },
      ]),
    );
  });

  it('maps category/brand slugs and a price range', () => {
    const where = repo.buildWhere(
      baseQuery({ category: 'shirts', brand: 'acme', minPrice: 100, maxPrice: 500 }),
    );
    expect(where.category).toEqual({ slug: 'shirts' });
    expect(where.brand).toEqual({ slug: 'acme' });
    expect(where.sellingPrice).toEqual({ gte: 100, lte: 500 });
  });

  it('maps size/color to a variant filter and flags directly', () => {
    const where = repo.buildWhere(
      baseQuery({ size: 'M', color: 'Blue', fit: 'Slim', featured: true }),
    );
    expect(where.variants).toEqual({ some: { size: 'M', color: 'Blue' } });
    expect(where.fit).toBe('Slim');
    expect(where.featured).toBe(true);
  });
});

describe('PostgresSearchRepository.search', () => {
  it('returns items, total and name-resolved facets sorted by count', async () => {
    const prisma = {
      $transaction: vi.fn().mockResolvedValue([[{ id: 'p1' }], 1]),
      product: {
        findMany: vi.fn(),
        count: vi.fn(),
        groupBy: vi
          .fn()
          .mockResolvedValueOnce([
            { brandId: 'b1', _count: { _all: 5 } },
            { brandId: 'b2', _count: { _all: 9 } },
            { brandId: null, _count: { _all: 2 } },
          ])
          .mockResolvedValueOnce([{ categoryId: 'c1', _count: { _all: 7 } }]),
      },
      brand: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'b1', name: 'B One', slug: 'b-one' },
          { id: 'b2', name: 'B Two', slug: 'b-two' },
        ]),
      },
      category: {
        findMany: vi.fn().mockResolvedValue([{ id: 'c1', name: 'C One', slug: 'c-one' }]),
      },
    };
    const repo = new PostgresSearchRepository(prisma as unknown as PrismaService);
    const result = await repo.search(baseQuery({ q: 'x' }));

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.facets.brands.map((b) => b.id)).toEqual(['b2', 'b1']); // sorted by count desc
    expect(result.facets.brands[0]).toMatchObject({ id: 'b2', count: 9 });
    expect(result.facets.categories).toEqual([
      { id: 'c1', name: 'C One', slug: 'c-one', count: 7 },
    ]);
  });
});
