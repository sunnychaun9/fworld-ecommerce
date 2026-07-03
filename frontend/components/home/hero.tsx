import Link from 'next/link';
import * as React from 'react';

import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

/**
 * Premium single hero (no slider). Full-width band with an editorial headline,
 * supporting copy and two CTAs. Entrance uses a subtle CSS fade/slide (server
 * component — no JS), honouring reduced-motion via the global stylesheet.
 */
function Hero(): React.ReactElement {
  return (
    <section
      aria-labelledby="hero-heading"
      className="border-border/60 bg-muted/30 relative overflow-hidden border-b"
    >
      {/* Decorative depth — a soft, brand-tinted wash behind the content. */}
      <div
        aria-hidden="true"
        className="to-background pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent"
      />
      <div
        aria-hidden="true"
        className="bg-brand/5 pointer-events-none absolute -right-24 -top-24 size-[32rem] rounded-full blur-3xl"
      />

      <Container className="relative flex min-h-[78svh] flex-col justify-end gap-6 py-16 sm:py-24 lg:min-h-[84svh]">
        <div className="animate-in fade-in slide-in-from-bottom-4 max-w-3xl duration-700">
          <p className="text-muted-foreground mb-5 text-xs font-medium uppercase tracking-[0.3em]">
            Autumn / Winter 2026
          </p>
          <h1
            id="hero-heading"
            className="font-display text-foreground text-balance text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Considered essentials for the modern wardrobe
          </h1>
          <p className="text-muted-foreground mt-6 max-w-xl text-pretty text-sm leading-relaxed sm:text-base">
            Premium Indian fashion — refined silhouettes, honest materials, and pieces designed to
            last well beyond the season.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href={ROUTES.men}>Shop Men</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={ROUTES.collections}>Explore Collections</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

export { Hero };
