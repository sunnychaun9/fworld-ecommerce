import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

/**
 * Background-job data-access layer. **All Prisma queries live here**; the service
 * holds scheduling/orchestration only.
 */
@Injectable()
export class JobsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async deleteExpiredCoupons(now: Date): Promise<number> {
    const result = await this.prisma.coupon.deleteMany({
      where: { validTo: { not: null, lt: now } },
    });
    return result.count;
  }

  async deleteExpiredNotifications(cutoff: Date): Promise<number> {
    const result = await this.prisma.notification.deleteMany({
      where: {
        OR: [{ deletedAt: { not: null } }, { readAt: { not: null }, createdAt: { lt: cutoff } }],
      },
    });
    return result.count;
  }

  async deleteAbandonedCarts(cutoff: Date): Promise<number> {
    const result = await this.prisma.cart.deleteMany({ where: { updatedAt: { lt: cutoff } } });
    return result.count;
  }

  async deleteExpiredPendingPayments(cutoff: Date): Promise<number> {
    const result = await this.prisma.payment.deleteMany({
      where: { status: 'PENDING', createdAt: { lt: cutoff } },
    });
    return result.count;
  }
}
