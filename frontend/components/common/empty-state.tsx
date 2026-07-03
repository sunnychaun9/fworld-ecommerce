import * as React from 'react';

import { cn } from '@/lib/utils';

interface EmptyStateProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  /** Optional leading icon/illustration. */
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Optional call-to-action (e.g. a Button). */
  action?: React.ReactNode;
}

/**
 * Centred empty-state block for zero-result surfaces (empty cart, no results,
 * 404 bodies). Presentational and composable.
 */
function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps): React.ReactElement {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        'mx-auto flex max-w-md flex-col items-center justify-center gap-3 px-6 py-16 text-center',
        className,
      )}
      {...props}
    >
      {icon ? <div className="text-muted-foreground mb-1 [&_svg]:size-10">{icon}</div> : null}
      <h2 className="text-foreground text-lg font-medium tracking-tight">{title}</h2>
      {description ? (
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
