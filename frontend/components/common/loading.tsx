import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

interface LoadingProps extends React.ComponentProps<'div'> {
  /** Accessible label announced to screen readers. */
  label?: string;
  /** Fill the viewport height and centre the spinner (route-level loading). */
  fullScreen?: boolean;
  size?: number;
}

/**
 * Neutral loading indicator used by Suspense/route loading boundaries and inline
 * pending states.
 */
function Loading({
  label = 'Loading',
  fullScreen = false,
  size = 24,
  className,
  ...props
}: LoadingProps): React.ReactElement {
  return (
    <div
      data-slot="loading"
      role="status"
      aria-live="polite"
      className={cn(
        'text-muted-foreground flex items-center justify-center',
        fullScreen ? 'min-h-[60dvh] w-full' : 'p-6',
        className,
      )}
      {...props}
    >
      <Loader2 className="animate-spin" style={{ width: size, height: size }} />
      <span className="sr-only">{label}…</span>
    </div>
  );
}

export { Loading };
