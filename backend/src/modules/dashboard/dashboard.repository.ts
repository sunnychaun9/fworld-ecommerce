import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

/**
 * Dashboard data-access layer. **All Prisma aggregate/count queries live here**;
 * the service composes the metric payload.
 */
@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  orderStatusCounts() {
    return this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } });
  }

  async revenue(): Promise<{ total: number; paidOrders: number }> {
    const result = await this.prisma.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { grandTotal: true },
      _count: { _all: true },
    });
    return {
      total: result._sum.grandTotal ? Number(result._sum.grandTotal) : 0,
      paidOrders: result._count._all,
    };
  }

  totalCustomers(): Promise<number> {
    return this.prisma.user.count({ where: { role: 'CUSTOMER' } });
  }

  activeProducts(): Promise<number> {
    return this.prisma.product.count({ where: { status: 'ACTIVE' } });
  }

  outOfStockCount(): Promise<number> {
    return this.prisma.inventory.count({ where: { availableStock: { lte: 0 } } });
  }

  lowStockCount(): Promise<number> {
    return this.prisma.inventory.count({
      where: { availableStock: { gt: 0, lte: this.prisma.inventory.fields.lowStockAlert } },
    });
  }

  recentOrders() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        grandTotal: true,
        createdAt: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });
  }
}
