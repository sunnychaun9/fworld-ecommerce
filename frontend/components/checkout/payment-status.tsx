import { CircleAlert, CircleCheck, Clock } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

interface PaymentStatusProps {
  /** Order `paymentStatus`: PAID | PENDING | FAILED | REFUNDED. */
  status: string;
  className?: string;
}

const CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  PAID: { label: 'Payment successful', icon: CircleCheck, className: 'text-success' },
  PENDING: { label: 'Payment pending', icon: Clock, className: 'text-muted-foreground' },
  FAILED: { label: 'Payment failed', icon: CircleAlert, className: 'text-destructive' },
  REFUNDED: { label: 'Payment refunded', icon: CircleAlert, className: 'text-muted-foreground' },
};

/** Compact payment-status indicator with an icon and label. */
function PaymentStatus({ status, className }: PaymentStatusProps): React.ReactElement {
  const config = CONFIG[status] ?? {
    label: status,
    icon: Clock,
    className: 'text-muted-foreground',
  };
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-medium',
        config.className,
        className,
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {config.label}
    </span>
  );
}

export { PaymentStatus };
