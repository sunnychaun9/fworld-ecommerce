'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { PaginationBar } from '@/components/catalog/pagination-bar';
import { ErrorState } from '@/components/common/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROUTES } from '@/constants/routes';
import { useAdminOrders } from '@/features/admin/use-admin-orders';
import { formatCurrency, formatDate } from '@/lib/format';
import type { AdminOrderListItem } from '@/types/admin';

import { DataTable, type Column } from './data-table';
import { EntityToolbar } from './entity-toolbar';
import { StatusBadge } from './status-badge';

const STATUS_OPTIONS = [
  'ALL',
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];
const PAGE_SIZE = 20;

function AdminOrdersView(): React.ReactElement {
  const router = useRouter();
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState('ALL');
  const { data, isPending, isError, refetch, isPlaceholderData } = useAdminOrders({
    page,
    pageSize: PAGE_SIZE,
    ...(status !== 'ALL' ? { status } : {}),
  });

  const columns: Column<AdminOrderListItem>[] = [
    {
      key: 'id',
      header: 'Order',
      cell: (o) => <span className="font-medium">#{o.id.slice(0, 8).toUpperCase()}</span>,
    },
    { key: 'customer', header: 'Customer', cell: (o) => o.user.email },
    {
      key: 'items',
      header: 'Items',
      align: 'right',
      cell: (o) => <span className="tabular-nums">{o._count.items}</span>,
    },
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
    <div>
      <EntityToolbar title="Orders" description="Review and fulfil customer orders.">
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option === 'ALL'
                  ? 'All statuses'
                  : option.charAt(0) + option.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </EntityToolbar>

      {isPending ? (
        <Skeleton className="h-96 w-full rounded-lg" />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <div className="space-y-6" aria-busy={isPlaceholderData}>
          <DataTable
            columns={columns}
            rows={data.items}
            rowKey={(o) => o.id}
            onRowClick={(o) => router.push(ROUTES.adminOrder(o.id))}
            empty={
              <div className="border-border text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
                No orders found.
              </div>
            }
          />
          <PaginationBar
            page={data.page}
            totalPages={Math.max(1, Math.ceil(data.total / data.pageSize))}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

export { AdminOrdersView };
