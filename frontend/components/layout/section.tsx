import * as React from 'react';

import { Container } from '@/components/common/container';
import { cn } from '@/lib/utils';

interface SectionProps extends React.ComponentProps<'section'> {
  /** Wrap children in the responsive Container (default true). */
  containerized?: boolean;
}

/**
 * Vertical layout rhythm primitive. Applies consistent block spacing and,
 * by default, the horizontal Container so page content lines up across routes.
 */
function Section({
  containerized = true,
  className,
  children,
  ...props
}: SectionProps): React.ReactElement {
  return (
    <section className={cn('py-12 sm:py-16 lg:py-20', className)} {...props}>
      {containerized ? <Container>{children}</Container> : children}
    </section>
  );
}

export { Section };
