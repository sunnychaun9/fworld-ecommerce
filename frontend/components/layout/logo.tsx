import Link from 'next/link';
import * as React from 'react';

import { appConfig } from '@/config/app';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

/**
 * Brand wordmark. Links home and is the primary logo used across the shell.
 * Uses the display typeface with tight tracking for an editorial feel.
 */
function Logo({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Link>, 'href'>): React.ReactElement {
  return (
    <Link
      href={ROUTES.home}
      aria-label={`${appConfig.name} — home`}
      className={cn(
        'font-display text-foreground text-xl font-medium uppercase tracking-[0.2em] transition-opacity hover:opacity-70',
        className,
      )}
      {...props}
    >
      {appConfig.name}
    </Link>
  );
}

export { Logo };
