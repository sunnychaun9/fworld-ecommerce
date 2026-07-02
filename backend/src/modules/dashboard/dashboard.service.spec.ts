import { describe, expect, it, vi } from 'vitest';

import { DashboardRepository } from './dashboard.repository';
import { DashboardService } from './dashboard.service';

interface RepoMock {
  orderStatusCounts: ReturnType<typeof vi.fn>;
  revenue: ReturnType<typeof vi.fn>;
  totalCustomers: ReturnType<typeof vi.fn>;
  activeProducts: ReturnType<typeof vi.fn>;
  outOfStockCount: ReturnType<typeof vi.fn>;
  lowStockCount: ReturnType<typeof vi.fn>;
  recentOrders: ReturnType<typeof vi.fn>;
}

function makeService(): { service: DashboardService; repo: RepoMock } {
  const repo: RepoMock = {
    orderStatusCounts: vi.fn().mockResolvedValue([
      { status: 'PENDING', _count: { _all: 2 } },
      { status: 'CONFIRMED', _count: { _all: 3 } },
      { status: 'DELIVERED', _count: { _all: 4 } },
      { status: 'CANCELLED', _count: { _all: 1 } },
    ]),
    revenue: vi.fn().mockResolvedValue({ total: 5000, paidOrders: 4 }),
    totalCustomers: vi.fn().mockResolvedValue(12),
    activeProducts: vi.fn().mockResolvedValue(7),
    outOfStockCount: vi.fn().mockResolvedValue(1),
    lowStockCount: vi.fn().mockResolvedValue(2),
    recentOrders: vi.fn().mockResolvedValue([{ id: 'o1' }]),
  };
  return { service: new DashboardService(repo as unknown as DashboardRepository), repo };
}

describe('DashboardService.summary', () => {
  it('aggregates order counts and computes totals and AOV', async () => {
    const { service } = makeService();
    const result = await service.summary();

    expect(result.orders).toMatchObject({
      total: 10,
      pending: 2,
      confirmed: 3,
      delivered: 4,
      cancelled: 1,
      processing: 0,
      shipped: 0,
    });
    expect(result.revenue.total).toBe(5000);
    expect(result.sales).toMatchObject({ revenue: 5000, averageOrderValue: 1250, paidOrders: 4 });
    expect(result.customers).toEqual({ total: 12 });
    expect(result.products).toEqual({ active: 7 });
    expect(result.inventory).toEqual({ lowStock: 2, outOfStock: 1 });
    expect(result.recentOrders).toHaveLength(1);
  });

  it('reports a zero average order value when there are no paid orders', async () => {
    const { service, repo } = makeService();
    repo.revenue.mockResolvedValue({ total: 0, paidOrders: 0 });
    const result = await service.summary();
    expect(result.sales.averageOrderValue).toBe(0);
  });
});
