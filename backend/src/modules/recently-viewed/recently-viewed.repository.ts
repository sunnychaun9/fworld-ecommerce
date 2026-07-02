import { Injectable } from '@nestjs/common';

import { newId } from '../../common/utils/id.util';
import { PrismaService } from '../../database/prisma.service';

/**
 * Recently-viewed data-access layer. **All Prisma queries live here**; the
 * service holds business logic only.
 */
@Injectable()
export class RecentlyViewedRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Active recently-viewed products, newest first. */
  findManyByUser(userId: string) {
    return this.prisma.recentlyViewed.findMany({
      where: { userId, product: { status: 'ACTIVE' } },
      orderBy: { viewedAt: 'desc' },
      include: {
        product: {
          include: { images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }], take: 1 } },
        },
      },
    });
  }

  async productStatus(productId: string): Promise<string | null> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { status: true },
    });
    return product?.status ?? null;
  }

  /** Insert or refresh the view timestamp (one row per user/product). */
  upsert(userId: string, productId: string, viewedAt: Date) {
    return this.prisma.recentlyViewed.upsert({
      where: { userId_productId: { userId, productId } },
      create: { id: newId(), userId, productId, viewedAt },
      update: { viewedAt },
    });
  }

  /** Delete entries beyond the newest `limit` for the user. */
  async pruneToLimit(userId: string, limit: number): Promise<void> {
    const stale = await this.prisma.recentlyViewed.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      skip: limit,
      select: { id: true },
    });
    if (stale.length > 0) {
      await this.prisma.recentlyViewed.deleteMany({
        where: { id: { in: stale.map((e) => e.id) } },
      });
    }
  }

  async clear(userId: string): Promise<void> {
    await this.prisma.recentlyViewed.deleteMany({ where: { userId } });
  }
}
