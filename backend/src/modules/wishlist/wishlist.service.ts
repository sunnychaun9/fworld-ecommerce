import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';

import { AddWishlistDto, UUID_PATTERN } from './dto/add-wishlist.dto';
import { WishlistRepository } from './wishlist.repository';

/**
 * Wishlist service. One entry per product per user; duplicate adds return the
 * existing entry; only ACTIVE products may be added. Holds business logic only;
 * every Prisma query is delegated to {@link WishlistRepository}.
 */
@Injectable()
export class WishlistService {
  constructor(private readonly repository: WishlistRepository) {}

  list(userId: string) {
    return this.repository.findManyByUser(userId);
  }

  async add(userId: string, dto: AddWishlistDto) {
    const status = await this.repository.productStatus(dto.productId);
    if (status === null) {
      throw new UnprocessableEntityException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product does not exist',
      });
    }
    if (status !== 'ACTIVE') {
      throw new UnprocessableEntityException({
        code: 'PRODUCT_NOT_ACTIVE',
        message: 'Only active products can be wishlisted',
      });
    }

    const existing = await this.repository.findEntry(userId, dto.productId);
    if (existing) {
      return existing;
    }
    return this.repository.create(userId, dto.productId);
  }

  async remove(userId: string, productId: string) {
    if (!UUID_PATTERN.test(productId)) {
      throw this.notFound();
    }
    const removed = await this.repository.deleteEntry(userId, productId);
    if (removed === 0) {
      throw this.notFound();
    }
    return { productId };
  }

  private notFound(): NotFoundException {
    return new NotFoundException({ code: 'NOT_FOUND', message: 'Wishlist item not found' });
  }
}
