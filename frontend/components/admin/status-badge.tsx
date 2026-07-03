import * as React from 'react';

import { Badge } from '@/components/ui/badge';

type BadgeVariant = React.ComponentProps<typeof Badge>['variant'];

/** Status → badge tone across all admin entities (orders, products, returns…). */
const TONES: Record<string, BadgeVariant> = {
  // product / taxonomy
  ACTIVE: 'success',
  DRAFT: 'secondary',
  ARCHIVED: 'outline',
  // order lifecycle
  PENDING: 'secondary',
  CONFIRMED: 'default',
  PROCESSING: 'default',
  SHIPPED: 'default',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'destructive',
  // payment
  PAID: 'success',
  FAILED: 'destructive',
  REFUNDED: 'outline',
  // returns
  REQUESTED: 'secondary',
  APPROVED: 'default',
  RECEIVED: 'default',
  REJECTED: 'destructive',
};

function label(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

/** Renders a status string as a coloured badge. */
function StatusBadge({ status }: { status: string }): React.ReactElement {
  return <Badge variant={TONES[status] ?? 'secondary'}>{label(status)}</Badge>;
}

export { StatusBadge };
