import { Check } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

import { isCancelled, orderStatusSteps } from './order-steps';

/** Compact horizontal progress indicator for an order's fulfilment status. */
function OrderTimeline({ status }: { status: string }): React.ReactElement {
  if (isCancelled(status)) {
    return <p className="text-destructive text-sm font-medium">This order was cancelled.</p>;
  }

  const steps = orderStatusSteps(status);

  return (
    <ol className="flex items-center">
      {steps.map((step, index) => (
        <React.Fragment key={step.label}>
          <li className="flex flex-col items-center gap-1.5 text-center">
            <span
              aria-hidden="true"
              className={cn(
                'flex size-6 items-center justify-center rounded-full border text-[10px] transition-colors',
                step.state === 'done' && 'border-foreground bg-foreground text-background',
                step.state === 'active' && 'border-foreground text-foreground',
                step.state === 'upcoming' && 'border-border text-muted-foreground',
              )}
            >
              {step.state === 'done' ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span
              className={cn(
                'text-[11px]',
                step.state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground',
              )}
            >
              {step.label}
            </span>
          </li>
          {index < steps.length - 1 ? (
            <span
              aria-hidden="true"
              className={cn(
                'mx-1 mb-5 h-px flex-1',
                step.state === 'done' ? 'bg-foreground' : 'bg-border',
              )}
            />
          ) : null}
        </React.Fragment>
      ))}
    </ol>
  );
}

export { OrderTimeline };
