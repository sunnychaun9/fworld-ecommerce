import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Horizontal layout container: centres content, caps width for readability on
 * ultrawide displays, and applies responsive gutters (mobile → desktop).
 */
function Container({
  className,
  asChild,
  ...props
}: React.ComponentProps<'div'> & { asChild?: boolean }): React.ReactElement {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      data-slot="container"
      className={cn('mx-auto w-full max-w-[96rem] px-4 sm:px-6 lg:px-8', className)}
      {...props}
    />
  );
}

export { Container };
