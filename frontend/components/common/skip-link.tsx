import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Keyboard-only "skip to content" link. Visually hidden until focused, letting
 * keyboard/AT users bypass navigation. Target the id on the page's <main>.
 */
function SkipLink({
  className,
  href = '#main-content',
  children = 'Skip to content',
  ...props
}: React.ComponentProps<'a'>): React.ReactElement {
  return (
    <a
      href={href}
      data-slot="skip-link"
      className={cn(
        'bg-background text-foreground ring-ring sr-only z-50 rounded-md px-4 py-2 text-sm font-medium shadow-md ring-2',
        'focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4',
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}

export { SkipLink };
