import * as React from 'react';

import { cn } from '@/lib/utils';

interface SectionHeadingProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Optional trailing action (e.g. a "View all" link), shown on sm+. */
  action?: React.ReactNode;
  as?: 'h2' | 'h3';
}

/**
 * Reusable section header: eyebrow, display title, optional description and a
 * trailing action. Shared across the home sections for consistent rhythm.
 */
function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  as: Heading = 'h2',
  className,
  ...props
}: SectionHeadingProps): React.ReactElement {
  return (
    <div className={cn('flex items-end justify-between gap-6', className)} {...props}>
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-[0.25em]">
            {eyebrow}
          </p>
        ) : null}
        <Heading className="font-display text-foreground text-3xl font-medium tracking-tight sm:text-4xl">
          {title}
        </Heading>
        {description ? (
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{description}</p>
        ) : null}
      </div>
      {action ? <div className="hidden shrink-0 sm:block">{action}</div> : null}
    </div>
  );
}

export { SectionHeading };
