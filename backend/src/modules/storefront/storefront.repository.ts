import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { StoreSort } from './dto/list-store-products.dto';

/** Allow-listed storefront product filters (built into a Prisma `where` here). */
export interface StoreProductFilters {
  categoryId?: string;
  brandId?: string;
  priceMin?: number;
  priceMax?: number;
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  fit?: string;
  fabric?: string;
  sleeveLength?: string;
  pattern?: string;
  neckType?: string;
  occasion?: string;
  color?: string;
  size?: string;
  inStock?: boolean;
}

/** Lean include for product cards (listings/home). */
export const STORE_CARD_INCLUDE = {
  brand: { select: { id: true, name: true, slug: true } },
  images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
  variants: { select: { id: true, inventory: { select: { availableStock: true } } } },
} satisfies Prisma.ProductInclude;

/** Full include for a product detail page. */
export const STORE_DETAIL_INCLUDE = {
  brand: true,
  category: true,
  images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
  variants: { orderBy: [{ size: 'asc' }, { color: 'asc' }], include: { inventory: true } },
  collections: { include: { collection: true } },
} satisfies Prisma.ProductInclude;

/**
 * Storefront data-access layer. **All Prisma queries live here**; the service
 * holds business logic only. Every query is scoped to ACTIVE products and eagerly
 * fetches related data to avoid N+1.
 */
@Injectable()
export class StorefrontRepository {
  constructor(private readonly prisma: PrismaService) {}

  listAndCount(filters: StoreProductFilters, sort: StoreSort, skip: number, take: number) {
    const where = this.buildWhere(filters);
    return this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: this.orderBy(sort),
        skip,
        take,
        include: STORE_CARD_INCLUDE,
      }),
      this.prisma.product.count({ where }),
    ]);
  }

  listFeatured(take: number) {
    return this.listActiveCards({ featured: true }, take);
  }

  listNewArrivals(take: number) {
    return this.listActiveCards({ newArrival: true }, take);
  }

  listBestSellers(take: number) {
    return this.listActiveCards({ bestSeller: true }, take);
  }

  listActiveCollections(take: number) {
    return this.prisma.collection.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take,
    });
  }

  findActiveProductBySlug(slug: string) {
    return this.prisma.product.findFirst({
      where: { slug, status: 'ACTIVE' },
      include: STORE_DETAIL_INCLUDE,
    });
  }

  findCollectionBySlug(slug: string) {
    return this.prisma.collection.findUnique({ where: { slug } });
  }

  async listCollectionActiveProducts(collectionId: string) {
    const rows = await this.prisma.collectionProduct.findMany({
      where: { collectionId, product: { status: 'ACTIVE' } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { product: { include: STORE_CARD_INCLUDE } },
    });
    return rows.map((row) => row.product);
  }

  findCategoryBySlug(slug: string) {
    return this.prisma.category.findUnique({ where: { slug } });
  }

  private listActiveCards(where: Prisma.ProductWhereInput, take: number) {
    return this.prisma.product.findMany({
      where: { status: 'ACTIVE', ...where },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      include: STORE_CARD_INCLUDE,
    });
  }

  private buildWhere(filters: StoreProductFilters): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = { status: 'ACTIVE' };
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters.brandId) {
      where.brandId = filters.brandId;
    }
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      where.sellingPrice = {
        ...(filters.priceMin !== undefined ? { gte: filters.priceMin } : {}),
        ...(filters.priceMax !== undefined ? { lte: filters.priceMax } : {}),
      };
    }
    if (filters.featured !== undefined) {
      where.featured = filters.featured;
    }
    if (filters.newArrival !== undefined) {
      where.newArrival = filters.newArrival;
    }
    if (filters.bestSeller !== undefined) {
      where.bestSeller = filters.bestSeller;
    }
    if (filters.fit !== undefined) {
      where.fit = filters.fit;
    }
    if (filters.fabric !== undefined) {
      where.fabric = filters.fabric;
    }
    if (filters.sleeveLength !== undefined) {
      where.sleeveLength = filters.sleeveLength;
    }
    if (filters.pattern !== undefined) {
      where.pattern = filters.pattern;
    }
    if (filters.neckType !== undefined) {
      where.neckType = filters.neckType;
    }
    if (filters.occasion !== undefined) {
      where.occasion = filters.occasion;
    }

    const variant: Prisma.ProductVariantWhereInput = {};
    if (filters.color !== undefined) {
      variant.color = filters.color;
    }
    if (filters.size !== undefined) {
      variant.size = filters.size;
    }
    if (filters.inStock) {
      variant.inventory = { availableStock: { gt: 0 } };
    }
    if (Object.keys(variant).length > 0) {
      where.variants = { some: variant };
    }

    return where;
  }

  private orderBy(sort: StoreSort): Prisma.ProductOrderByWithRelationInput[] {
    switch (sort) {
      case 'priceAsc':
        return [{ sellingPrice: 'asc' }, { id: 'asc' }];
      case 'priceDesc':
        return [{ sellingPrice: 'desc' }, { id: 'asc' }];
      case 'name':
        return [{ name: 'asc' }, { id: 'asc' }];
      default:
        return [{ createdAt: 'desc' }, { id: 'desc' }];
    }
  }
}
