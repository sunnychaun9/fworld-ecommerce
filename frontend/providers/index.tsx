'use client';

import { Toaster } from '@/components/ui/sonner';

import { AnalyticsProvider } from './analytics-provider';
import { QueryProvider } from './query-provider';
import { SessionProvider } from './session-provider';
import { ThemeProvider } from './theme-provider';

/**
 * Single composition of every client-side provider, wrapped once in the root
 * layout. Order matters: theme (outermost, so everything can read colour scheme)
 * → server-state → session → app tree, with the toast portal and analytics as
 * leaf siblings.
 */
export function AppProviders({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <ThemeProvider>
      <QueryProvider>
        <SessionProvider>
          {children}
          <Toaster />
          <AnalyticsProvider />
        </SessionProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
