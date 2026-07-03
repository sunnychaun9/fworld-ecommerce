'use client';

import {
  AlertTriangle,
  IndianRupee,
  PackageX,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { ErrorState } from '@/components/common/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useDashboard } from '@/features/admin/use-dashboard';
import { formatCurrency, formatDate } from '@/lib/format';
import type { DashboardData } from '@/types/admin';

import { DashboardCharts } from './dashboard-charts';
import { DataTable, type Column } from './data-table';
import { StatsCard } from './stats-card';
import { StatusBadge } from './status-badge';

type RecentOrder = DashboardData['recentOrders'][number];

/** Admin dashboard: KPIs, order-status chart and the latest orders. */
function DashboardView(): React.ReactElement {
  const { data, isPending, isError, refetch } = useDashboard();

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  const columns: Column<RecentOrder>[] = [
    {
      key: 'id',
      header: 'Order',
      cell: (o) => <span className="font-medium">#{o.id.slice(0, 8).toUpperCase()}</span>,
    },
    { key: 'customer', header: 'Customer', cell: (o) => o.user.email },
    { key: 'status', header: 'Status', cell: (o) => <StatusBadge status={o.status} /> },
    { key: 'payment', header: 'Payment', cell: (o) => <StatusBadge status={o.paymentStatus} /> },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      cell: (o) => <span className="tabular-nums">{formatCurrency(o.grandTotal)}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      cell: (o) => <span className="text-muted-foreground">{formatDate(o.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          label="Revenue"
          value={formatCurrency(data.revenue.total)}
          icon={<IndianRupee />}
        />
        <StatsCard label="Paid orders" value={data.sales.paidOrders} icon={<ShoppingCart />} />
        <StatsCard
          label="Avg. order value"
          value={formatCurrency(data.sales.averageOrderValue)}
          icon={<TrendingUp />}
        />
        <StatsCard label="Customers" value={data.customers.total} icon={<Users />} />
        <StatsCard label="Total orders" value={data.orders.total} icon={<ShoppingCart />} />
        <StatsCard label="Active products" value={data.products.active} icon={<TrendingUp />} />
        <StatsCard
          label="Low stock"
          value={data.inventory.lowStock}
          tone="warning"
          icon={<AlertTriangle />}
        />
        <StatsCard
          label="Out of stock"
          value={data.inventory.outOfStock}
          tone="danger"
          icon={<PackageX />}
        />
      </div>

      <DashboardCharts orders={data.orders} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-foreground text-sm font-medium">Latest orders</h2>
          <Link
            href={ROUTES.adminOrders}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            View all
          </Link>
        </div>
        <DataTable
          columns={columns}
          rows={data.recentOrders}
          rowKey={(o) => o.id}
          onRowClick={undefined}
          empty={
            <div className="border-border text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
              No orders yet.
            </div>
          }
        />
      </div>
    </div>
  );
}

export { DashboardView };
