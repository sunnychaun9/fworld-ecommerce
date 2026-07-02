import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

/**
 * Coupon data-access layer. **All Prisma queries live here**; the service holds
 * business logic only.
 */
@Injectable()
export class CouponsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.CouponUncheckedCreateInput) {
    return this.prisma.coupon.create({ data });
  }

  findById(id: string) {
    return this.prisma.coupon.findUnique({ where: { id } });
  }

  findByCode(code: string) {
    return this.prisma.coupon.findUnique({ where: { code } });
  }

  update(id: string, data: Prisma.CouponUncheckedUpdateInput) {
    return this.prisma.coupon.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.coupon.delete({ where: { id } });
  }

  countUsages(couponId: string): Promise<number> {
    return this.prisma.couponUsage.count({ where: { couponId } });
  }

  countUserUsages(couponId: string, userId: string): Promise<number> {
    return this.prisma.couponUsage.count({ where: { couponId, userId } });
  }

  /** Active coupons currently within their validity window. */
  listActiveValid(now: Date) {
    return this.prisma.coupon.findMany({
      where: {
        active: true,
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
          { OR: [{ validTo: null }, { validTo: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
