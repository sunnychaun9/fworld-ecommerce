import { Check, ExternalLink, Truck } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { OrderTracking } from '@/types/tracking';

import { isCancelled, orderStatusSteps } from './order-steps';

interface TrackingTimelineProps {
  status: string;
  /** Shipment projection from `GET /orders/:id/tracking`, or null when unshipped. */
  tracking: OrderTracking | null;
}

/** Vertical fulfilment timeline with shipment details when available. */
function TrackingTimeline({ status, tracking }: TrackingTimelineProps): React.ReactElement {
  const steps = orderStatusSteps(status);
  const cancelled = isCancelled(status);

  // Attach known shipment dates to the relevant steps.
  const dateFor = (label: string): string | null => {
    if (label === 'Shipped') return tracking?.shippedAt ?? null;
    if (label === 'Delivered') return tracking?.deliveredAt ?? null;
    return null;
  };

  return (
    <div className="space-y-6">
      {cancelled ? (
        <p className="text-destructive text-sm font-medium">This order was cancelled.</p>
      ) : (
        <ol className="relative">
          {steps.map((step, index) => {
            const date = dateFor(step.label);
            return (
              <li key={step.label} className="relative flex gap-4 pb-6 last:pb-0">
                {index < steps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute -bottom-0 left-3 top-6 w-px',
                      step.state === 'done' ? 'bg-foreground' : 'bg-border',
                    )}
                  />
                ) : null}
                <span
                  aria-hidden="true"
                  className={cn(
                    'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border',
                    step.state === 'done' && 'border-foreground bg-foreground text-background',
                    step.state === 'active' && 'border-foreground text-foreground',
                    step.state === 'upcoming' && 'border-border text-muted-foreground',
                  )}
                >
                  {step.state === 'done' ? (
                    <Check className="size-3.5" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-current" />
                  )}
                </span>
                <div
                  className="-mt-0.5"
                  aria-current={step.state === 'active' ? 'step' : undefined}
                >
                  <p
                    className={cn(
                      'text-sm font-medium',
                      step.state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground',
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-muted-foreground text-xs">{step.description}</p>
                  {date ? (
                    <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                      {formatDate(date)}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {tracking ? (
        <div className="border-border rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Truck className="size-4" aria-hidden="true" />
            {tracking.courier}
          </div>
          <dl className="text-muted-foreground mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt>Tracking number</dt>
              <dd className="text-foreground font-medium">{tracking.trackingNumber}</dd>
            </div>
            {tracking.estimatedDelivery ? (
              <div className="flex justify-between gap-4">
                <dt>Estimated delivery</dt>
                <dd className="text-foreground">{formatDate(tracking.estimatedDelivery)}</dd>
              </div>
            ) : null}
          </dl>
          {tracking.trackingUrl ? (
            <Button asChild variant="outline" size="sm" className="mt-4">
              <a href={tracking.trackingUrl} target="_blank" rel="noopener noreferrer">
                Track shipment
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          ) : null}
        </div>
      ) : !cancelled ? (
        <p className="text-muted-foreground text-sm">
          Tracking details will appear here once your order ships.
        </p>
      ) : null}
    </div>
  );
}

export { TrackingTimeline };
