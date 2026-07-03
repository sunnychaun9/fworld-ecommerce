import * as React from 'react';

import { Container } from '@/components/common/container';
import { cn } from '@/lib/utils';

interface PageHeaderProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  /** Small uppercase kicker above the title. */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
}

/**
 * Editorial page header band: an optional eyebrow, a large display title, and a
 * supporting description. Used at the top of section landing pages.
 */
function PageHeader({
  eyebrow,
  title,
  description,
  className,
  children,
  ...props
}: PageHeaderProps): React.ReactElement {
  return (
    <div className={cn('border-border/60 border-b', className)} {...props}>
      <Container className="py-12 sm:py-16 lg:py-20">
        {eyebrow ? (
          <p className="text-muted-foreground mb-4 text-xs font-medium uppercase tracking-[0.25em]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-foreground text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground mt-5 max-w-2xl text-sm leading-relaxed sm:text-base">
            {description}
          </p>
        ) : null}
        {children}
      </Container>
    </div>
  );
}

export { PageHeader };
