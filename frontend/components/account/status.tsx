import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import type { ReturnStatus } from '@/types/return';

type BadgeVariant = React.ComponentProps<typeof Badge>['variant'];

const ORDER_STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: 'Pending', variant: 'secondary' },
  CONFIRMED: { label: 'Confirmed', variant: 'default' },
  PROCESSING: { label: 'Processing', variant: 'default' },
  SHIPPED: { label: 'Shipped', variant: 'default' },
  DELIVERED: { label: 'Delivered', variant: 'success' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

const PAYMENT_STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: 'Payment pending', variant: 'secondary' },
  PAID: { label: 'Paid', variant: 'success' },
  FAILED: { label: 'Payment failed', variant: 'destructive' },
  REFUNDED: { label: 'Refunded', variant: 'outline' },
};

const RETURN_STATUS: Record<ReturnStatus, { label: string; variant: BadgeVariant }> = {
  REQUESTED: { label: 'Requested', variant: 'secondary' },
  APPROVED: { label: 'Approved', variant: 'default' },
  RECEIVED: { label: 'Received', variant: 'default' },
  REFUNDED: { label: 'Refunded', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
};

export function OrderStatusBadge({ status }: { status: string }): React.ReactElement {
  const config = ORDER_STATUS[status] ?? { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: string }): React.ReactElement {
  const config = PAYMENT_STATUS[status] ?? { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function ReturnStatusBadge({ status }: { status: ReturnStatus }): React.ReactElement {
  const config = RETURN_STATUS[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
