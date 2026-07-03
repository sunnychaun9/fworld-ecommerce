'use client';

import { useEffect } from 'react';

import { ErrorState } from '@/components/common/error-state';
import { Container } from '@/components/common/container';

/**
 * Root error boundary. Client component per the App Router contract; logs the
 * error and offers a recovery action via `reset`.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[70dvh] items-center justify-center">
      <ErrorState onRetry={reset} />
    </Container>
  );
}
