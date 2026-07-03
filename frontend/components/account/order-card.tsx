import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { ROUTES } from '@/constants/routes';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Order } from '@/types/order';

import { OrderStatusBadge, PaymentStatusBadge } from './status';

/** Summary card for a single order, linking to its detail page. */
function OrderCard({ order }: { order: Order }): React.ReactElement {
  const shortId = order.id.slice(0, 8).toUpperCase();
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
  const firstItem = order.items[0];
  const extra = order.items.length - 1;
  const summary = firstItem
    ? extra > 0
      ? `${firstItem.productName} + ${extra} more`
      : firstItem.productName
    : 'No items';

  return (
    <Link
      href={ROUTES.accountOrder(order.id)}
      className="border-border hover:border-foreground/30 focus-visible:ring-ring group block rounded-lg border p-4 outline-none transition-colors focus-visible:ring-2 sm:p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-foreground text-sm font-medium">Order #{shortId}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">{formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <p className="text-muted-foreground mt-3 truncate text-sm">{summary}</p>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PaymentStatusBadge status={order.paymentStatus} />
          <span className="text-muted-foreground text-xs">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-foreground text-sm font-medium tabular-nums">
            {formatCurrency(order.grandTotal)}
          </span>
          <ChevronRight className="text-muted-foreground group-hover:text-foreground size-4 transition-colors" />
        </div>
      </div>
    </Link>
  );
}

export { OrderCard };
