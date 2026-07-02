import { Injectable, UnprocessableEntityException } from '@nestjs/common';

import { RecentlyViewedRepository } from './recently-viewed.repository';

const MAX_ENTRIES = 50;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Recently-viewed service. One entry per product (re-view refreshes the
 * timestamp), capped at {@link MAX_ENTRIES} newest per user, ACTIVE products
 * only. Holds business logic only; every Prisma query is delegated to the
 * repository.
 */
@Injectable()
export class RecentlyViewedService {
  constructor(private readonly repository: RecentlyViewedRepository) {}

  list(userId: string) {
    return this.repository.findManyByUser(userId);
  }

  async record(userId: string, productId: string) {
    if (!UUID_PATTERN.test(productId)) {
      throw this.unprocessable('PRODUCT_NOT_FOUND', 'Product does not exist');
    }
    const status = await this.repository.productStatus(productId);
    if (status === null) {
      throw this.unprocessable('PRODUCT_NOT_FOUND', 'Product does not exist');
    }
    if (status !== 'ACTIVE') {
      throw this.unprocessable('PRODUCT_NOT_ACTIVE', 'Only active products can be viewed');
    }

    await this.repository.upsert(userId, productId, new Date());
    await this.repository.pruneToLimit(userId, MAX_ENTRIES);
    return this.repository.findManyByUser(userId);
  }

  async clear(userId: string) {
    await this.repository.clear(userId);
    return { cleared: true };
  }

  private unprocessable(code: string, message: string): UnprocessableEntityException {
    return new UnprocessableEntityException({ code, message });
  }
}
