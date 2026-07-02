import { Injectable, NotFoundException } from '@nestjs/common';

import { RecommendationsRepository } from './recommendations.repository';

type Card = Awaited<ReturnType<RecommendationsRepository['trending']>>[number];

const LIMIT = 12;
const PRICE_BAND = 0.2;

/**
 * Recommendations service — deterministic, no AI/ML. Product-page similarity is
 * ranked (category → brand → price band → featured fallback); home returns
 * trending/new/best; for-you prefers categories drawn from the user's wishlist,
 * recent views and orders. Prisma queries live in the repository.
 */
@Injectable()
export class RecommendationsService {
  constructor(private readonly repository: RecommendationsRepository) {}

  async forProduct(productId: string): Promise<Card[]> {
    const product = await this.repository.findProductBasic(productId);
    if (!product) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Product not found' });
    }

    const collected: Card[] = [];
    const seen = new Set<string>([productId]);
    const push = (items: Card[]): void => {
      for (const item of items) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          collected.push(item);
        }
      }
    };

    push(await this.repository.byCategory(product.categoryId, [...seen], LIMIT));
    if (collected.length < LIMIT && product.brandId) {
      push(await this.repository.byBrand(product.brandId, [...seen], LIMIT));
    }
    if (collected.length < LIMIT) {
      const price = Number(product.sellingPrice);
      push(
        await this.repository.byPriceRange(
          this.round(price * (1 - PRICE_BAND)),
          this.round(price * (1 + PRICE_BAND)),
          [...seen],
          LIMIT,
        ),
      );
    }
    if (collected.length < LIMIT) {
      push(await this.repository.featured([...seen], LIMIT));
    }
    return collected.slice(0, LIMIT);
  }

  async home() {
    const [trending, newArrivals, bestSellers] = await Promise.all([
      this.repository.trending(LIMIT),
      this.repository.newArrivals(LIMIT),
      this.repository.bestSellers(LIMIT),
    ]);
    return { trending, newArrivals, bestSellers };
  }

  async forYou(userId: string): Promise<Card[]> {
    const collected: Card[] = [];
    const seen = new Set<string>();
    const push = (items: Card[]): void => {
      for (const item of items) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          collected.push(item);
        }
      }
    };

    const categoryIds = await this.repository.userCategoryIds(userId);
    if (categoryIds.length > 0) {
      push(await this.repository.byCategories(categoryIds, [], LIMIT));
    }
    if (collected.length < LIMIT) {
      push(await this.repository.newArrivals(LIMIT));
    }
    if (collected.length < LIMIT) {
      push(await this.repository.trending(LIMIT));
    }
    return collected.slice(0, LIMIT);
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
