import { Injectable } from '@nestjs/common';

import { newId } from '../../common/utils/id.util';
import { PrismaService } from '../../database/prisma.service';

/**
 * Wishlist data-access layer. **All Prisma queries live here**; the service holds
 * business logic only.
 */
@Injectable()
export class WishlistRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByUser(userId: string) {
    return this.prisma.wishlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          include: { images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }], take: 1 } },
        },
      },
    });
  }

  findEntry(userId: string, productId: string) {
    return this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
  }

  /** Product status for the given id (null when the product does not exist). */
  async productStatus(productId: string): Promise<string | null> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { status: true },
    });
    return product?.status ?? null;
  }

  create(userId: string, productId: string) {
    return this.prisma.wishlist.create({ data: { id: newId(), userId, productId } });
  }

  async deleteEntry(userId: string, productId: string): Promise<number> {
    const result = await this.prisma.wishlist.deleteMany({ where: { userId, productId } });
    return result.count;
  }
}
