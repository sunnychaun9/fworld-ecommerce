'use client';

import { AlertTriangle } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** When provided, renders a retry button that invokes this callback. */
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Recoverable error surface for failed data loads and route error boundaries.
 * Renders a retry affordance when a handler is supplied.
 */
function ErrorState({
  title = 'Something went wrong',
  description = 'We could not complete your request. Please try again.',
  onRetry,
  retryLabel = 'Try again',
  className,
  ...props
}: ErrorStateProps): React.ReactElement {
  return (
    <div
      data-slot="error-state"
      role="alert"
      className={cn(
        'mx-auto flex max-w-md flex-col items-center justify-center gap-3 px-6 py-16 text-center',
        className,
      )}
      {...props}
    >
      <AlertTriangle className="text-destructive size-10" aria-hidden="true" />
      <h2 className="text-foreground text-lg font-medium tracking-tight">{title}</h2>
      {description ? (
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      ) : null}
      {onRetry ? (
        <Button variant="outline" onClick={onRetry} className="mt-2">
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

export { ErrorState };
