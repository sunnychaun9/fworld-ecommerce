import Link from 'next/link';

import { Container } from '@/components/common/container';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export default function NotFound(): React.ReactElement {
  return (
    <Container className="flex min-h-[70dvh] items-center justify-center">
      <EmptyState
        title="Page not found"
        description="The page you are looking for doesn't exist or has moved."
        action={
          <Button asChild variant="outline">
            <Link href={ROUTES.home}>Back to home</Link>
          </Button>
        }
      />
    </Container>
  );
}
