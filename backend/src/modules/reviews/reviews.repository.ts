import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

export interface ReviewAggregate {
  averageRating: number;
  totalReviews: number;
}

/**
 * Review data-access layer. **All Prisma queries live here** (including aggregate
 * computation); the service holds business logic only.
 */
@Injectable()
export class ReviewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ReviewUncheckedCreateInput) {
    return this.prisma.review.create({ data });
  }

  findById(userId: string, id: string) {
    return this.prisma.review.findFirst({ where: { id, userId } });
  }

  findEntry(userId: string, productId: string) {
    return this.prisma.review.findUnique({ where: { userId_productId: { userId, productId } } });
  }

  update(id: string, data: Prisma.ReviewUncheckedUpdateInput) {
    return this.prisma.review.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.review.delete({ where: { id } });
  }

  listByProduct(productId: string) {
    return this.prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  listByUser(userId: string) {
    return this.prisma.review.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  /** Live-computed rating aggregate for a product. */
  async aggregate(productId: string): Promise<ReviewAggregate> {
    const result = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { _all: true },
    });
    return {
      averageRating: result._avg.rating ? Math.round(result._avg.rating * 10) / 10 : 0,
      totalReviews: result._count._all,
    };
  }

  /** Whether the user has a PAID order containing the product. */
  async hasPurchased(userId: string, productId: string): Promise<boolean> {
    const count = await this.prisma.orderItem.count({
      where: { variant: { productId }, order: { userId, paymentStatus: 'PAID' } },
    });
    return count > 0;
  }
}
