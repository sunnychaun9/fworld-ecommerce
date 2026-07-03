import Link from 'next/link';

import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

/**
 * Storefront home — placeholder hero inside the completed shell. The real
 * merchandising home (hero media, product rails) is built in a later phase.
 */
export default function HomePage(): React.ReactElement {
  return (
    <Container className="flex min-h-[70dvh] flex-col items-center justify-center gap-8 py-20 text-center">
      <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.3em]">
        Autumn / Winter 2026
      </span>
      <h1 className="font-display text-foreground max-w-4xl text-balance text-5xl font-medium tracking-tight sm:text-6xl lg:text-7xl">
        Considered essentials for the modern wardrobe
      </h1>
      <p className="text-muted-foreground max-w-md text-balance text-sm leading-relaxed sm:text-base">
        The application shell is ready — navigation, search and footer are wired. Product
        experiences arrive in the next phases.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href={ROUTES.men}>Shop Men</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href={ROUTES.women}>Shop Women</Link>
        </Button>
      </div>
    </Container>
  );
}
