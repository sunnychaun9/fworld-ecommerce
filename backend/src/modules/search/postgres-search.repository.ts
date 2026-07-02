import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import {
  ProductSearchProvider,
  ProductSearchQuery,
  ProductSearchResult,
  SearchFacet,
} from './product-search.provider';

/** Lean product card for search results. */
const CARD_INCLUDE = {
  brand: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }], take: 1 },
} satisfies Prisma.ProductInclude;

/**
 * PostgreSQL product-search backend (ILIKE + indexed filters). **All Prisma
 * queries live here.** Implements {@link ProductSearchProvider} so it can be
 * swapped for a search engine later.
 */
@Injectable()
export class PostgresSearchRepository implements ProductSearchProvider {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: ProductSearchQuery): Promise<ProductSearchResult> {
    const where = this.buildWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: this.buildOrderBy(query.sort),
        skip,
        take: query.limit,
        include: CARD_INCLUDE,
      }),
      this.prisma.product.count({ where }),
    ]);

    const [brandGroups, categoryGroups] = await Promise.all([
      this.prisma.product.groupBy({ by: ['brandId'], where, _count: { _all: true } }),
      this.prisma.product.groupBy({ by: ['categoryId'], where, _count: { _all: true } }),
    ]);

    const facets = {
      brands: await this.buildFacets(
        'brand',
        brandGroups.map((g) => ({ id: g.brandId, count: g._count._all })),
      ),
      categories: await this.buildFacets(
        'category',
        categoryGroups.map((g) => ({ id: g.categoryId, count: g._count._all })),
      ),
    };
    return { items, total, facets };
  }

  /** Exposed for unit testing of query construction. */
  buildWhere(query: ProductSearchQuery): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = { status: 'ACTIVE' };

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { slug: { contains: query.q, mode: 'insensitive' } },
        { brand: { name: { contains: query.q, mode: 'insensitive' } } },
        { category: { name: { contains: query.q, mode: 'insensitive' } } },
      ];
    }
    if (query.category) {
      where.category = { slug: query.category };
    }
    if (query.brand) {
      where.brand = { slug: query.brand };
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.sellingPrice = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }
    if (query.fit) {
      where.fit = query.fit;
    }
    if (query.fabric) {
      where.fabric = query.fabric;
    }
    if (query.size || query.color) {
      where.variants = {
        some: {
          ...(query.size ? { size: query.size } : {}),
          ...(query.color ? { color: query.color } : {}),
        },
      };
    }
    if (query.featured !== undefined) {
      where.featured = query.featured;
    }
    if (query.bestSeller !== undefined) {
      where.bestSeller = query.bestSeller;
    }
    if (query.newArrival !== undefined) {
      where.newArrival = query.newArrival;
    }
    return where;
  }

  private buildOrderBy(sort: string): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case 'price_asc':
        return { sellingPrice: 'asc' };
      case 'price_desc':
        return { sellingPrice: 'desc' };
      case 'newest':
      case 'relevance':
      default:
        return { createdAt: 'desc' };
    }
  }

  private async buildFacets(
    kind: 'brand' | 'category',
    rows: { id: string | null; count: number }[],
  ): Promise<SearchFacet[]> {
    const ids = rows.map((r) => r.id).filter((id): id is string => id !== null);
    if (ids.length === 0) {
      return [];
    }
    const named =
      kind === 'brand'
        ? await this.prisma.brand.findMany({
            where: { id: { in: ids } },
            select: { id: true, name: true, slug: true },
          })
        : await this.prisma.category.findMany({
            where: { id: { in: ids } },
            select: { id: true, name: true, slug: true },
          });
    const counts = new Map(rows.map((r) => [r.id, r.count]));
    return named
      .map((entry) => ({ ...entry, count: counts.get(entry.id) ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }
}
