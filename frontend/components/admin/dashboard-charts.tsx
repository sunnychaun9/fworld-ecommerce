import * as React from 'react';

import { cn } from '@/lib/utils';

interface Segment {
  label: string;
  value: number;
  className: string;
}

interface DashboardChartsProps {
  orders: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
}

/** Lightweight CSS bar chart of the order-status breakdown (no chart library). */
function DashboardCharts({ orders }: DashboardChartsProps): React.ReactElement {
  const segments: Segment[] = [
    { label: 'Pending', value: orders.pending, className: 'bg-muted-foreground/40' },
    { label: 'Confirmed', value: orders.confirmed, className: 'bg-foreground/70' },
    { label: 'Processing', value: orders.processing, className: 'bg-foreground/70' },
    { label: 'Shipped', value: orders.shipped, className: 'bg-brand/70' },
    { label: 'Delivered', value: orders.delivered, className: 'bg-success/70' },
    { label: 'Cancelled', value: orders.cancelled, className: 'bg-destructive/60' },
  ];
  const max = Math.max(1, ...segments.map((s) => s.value));

  return (
    <div className="border-border bg-background rounded-lg border p-5">
      <h2 className="text-foreground text-sm font-medium">Orders by status</h2>
      <ul className="mt-4 space-y-3">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-3">
            <span className="text-muted-foreground w-20 shrink-0 text-xs">{segment.label}</span>
            <div className="bg-muted h-2.5 flex-1 overflow-hidden rounded-full">
              <div
                className={cn('h-full rounded-full', segment.className)}
                style={{ width: `${(segment.value / max) * 100}%` }}
              />
            </div>
            <span className="text-foreground w-8 shrink-0 text-right text-xs tabular-nums">
              {segment.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { DashboardCharts };
