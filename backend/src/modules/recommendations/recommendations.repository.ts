import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

/** Lean product card for recommendation payloads. */
const CARD_INCLUDE = {
  brand: { select: { id: true, name: true, slug: true } },
  images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }], take: 1 },
} satisfies Prisma.ProductInclude;

/**
 * Recommendations data-access layer. **All Prisma queries live here**; the
 * service composes deterministic recommendation logic on top. No AI/ML.
 */
@Injectable()
export class RecommendationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProductBasic(productId: string) {
    return this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, categoryId: true, brandId: true, sellingPrice: true, status: true },
    });
  }

  byCategory(categoryId: string, excludeIds: string[], take: number) {
    return this.listActive({ categoryId, id: { notIn: excludeIds } }, take);
  }

  byBrand(brandId: string, excludeIds: string[], take: number) {
    return this.listActive({ brandId, id: { notIn: excludeIds } }, take);
  }

  byPriceRange(min: number, max: number, excludeIds: string[], take: number) {
    return this.listActive(
      { sellingPrice: { gte: min, lte: max }, id: { notIn: excludeIds } },
      take,
    );
  }

  byCategories(categoryIds: string[], excludeIds: string[], take: number) {
    return this.listActive({ categoryId: { in: categoryIds }, id: { notIn: excludeIds } }, take);
  }

  featured(excludeIds: string[], take: number) {
    return this.listActive({ featured: true, id: { notIn: excludeIds } }, take);
  }

  trending(take: number) {
    return this.listActive({ featured: true }, take);
  }

  newArrivals(take: number) {
    return this.listActive({ newArrival: true }, take);
  }

  bestSellers(take: number) {
    return this.listActive({ bestSeller: true }, take);
  }

  /** Distinct category ids drawn from the user's wishlist, recent views and orders. */
  async userCategoryIds(userId: string): Promise<string[]> {
    const [wishlist, recent, orderItems] = await Promise.all([
      this.prisma.wishlist.findMany({
        where: { userId },
        select: { product: { select: { categoryId: true } } },
      }),
      this.prisma.recentlyViewed.findMany({
        where: { userId },
        select: { product: { select: { categoryId: true } } },
      }),
      this.prisma.orderItem.findMany({
        where: { order: { userId } },
        select: { variant: { select: { product: { select: { categoryId: true } } } } },
      }),
    ]);

    const ids = new Set<string>();
    wishlist.forEach((entry) => ids.add(entry.product.categoryId));
    recent.forEach((entry) => ids.add(entry.product.categoryId));
    orderItems.forEach((item) => {
      if (item.variant?.product) {
        ids.add(item.variant.product.categoryId);
      }
    });
    return [...ids];
  }

  private listActive(where: Prisma.ProductWhereInput, take: number) {
    return this.prisma.product.findMany({
      where: { status: 'ACTIVE', ...where },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      include: CARD_INCLUDE,
    });
  }
}
