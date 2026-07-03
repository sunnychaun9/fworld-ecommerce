'use client';

import { Package } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { PaginationBar } from '@/components/catalog/pagination-bar';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useOrders } from '@/features/orders/use-orders';

import { OrderCard } from './order-card';

/** Paginated list of the current user's orders. */
function OrdersView(): React.ReactElement {
  const [page, setPage] = React.useState(1);
  const { data, isPending, isError, refetch, isPlaceholderData } = useOrders(page);

  if (isPending) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  if (data.items.length === 0) {
    return (
      <EmptyState
        icon={<Package />}
        title="No orders yet"
        description="When you place an order, it will show up here."
        action={
          <Button asChild>
            <Link href={ROUTES.men}>Start shopping</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6" aria-busy={isPlaceholderData}>
      <div className="space-y-4">
        {data.items.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
      <PaginationBar
        page={data.pageInfo.page}
        totalPages={data.pageInfo.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}

export { OrdersView };
