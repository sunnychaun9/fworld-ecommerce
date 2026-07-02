import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

import { DashboardRepository } from './dashboard.repository';

/**
 * Admin dashboard service. Assembles sales, order, customer, product, inventory
 * and revenue metrics plus the latest orders. Holds business logic only; every
 * Prisma query is delegated to {@link DashboardRepository}.
 */
@Injectable()
export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async summary() {
    const [statusCounts, revenue, customers, activeProducts, outOfStock, lowStock, recentOrders] =
      await Promise.all([
        this.repository.orderStatusCounts(),
        this.repository.revenue(),
        this.repository.totalCustomers(),
        this.repository.activeProducts(),
        this.repository.outOfStockCount(),
        this.repository.lowStockCount(),
        this.repository.recentOrders(),
      ]);

    const countFor = (status: OrderStatus): number =>
      statusCounts.find((group) => group.status === status)?._count._all ?? 0;
    const totalOrders = statusCounts.reduce((sum, group) => sum + group._count._all, 0);
    const averageOrderValue =
      revenue.paidOrders > 0 ? Math.round((revenue.total / revenue.paidOrders) * 100) / 100 : 0;

    return {
      sales: {
        revenue: revenue.total,
        averageOrderValue,
        paidOrders: revenue.paidOrders,
      },
      orders: {
        total: totalOrders,
        pending: countFor('PENDING'),
        confirmed: countFor('CONFIRMED'),
        processing: countFor('PROCESSING'),
        shipped: countFor('SHIPPED'),
        delivered: countFor('DELIVERED'),
        cancelled: countFor('CANCELLED'),
      },
      customers: { total: customers },
      products: { active: activeProducts },
      inventory: { lowStock, outOfStock },
      revenue: { total: revenue.total },
      recentOrders,
    };
  }
}
