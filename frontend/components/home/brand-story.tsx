import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { appConfig } from '@/config/app';
import { ROUTES } from '@/constants/routes';

import { Reveal } from './reveal';

/**
 * Editorial brand-story section: premium typography with a placeholder image
 * panel and a CTA. Static server component.
 */
function BrandStory(): React.ReactElement {
  return (
    <section
      aria-labelledby="brand-story-heading"
      className="border-border/60 bg-muted/20 border-y py-16 sm:py-24"
    >
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-lg lg:order-last">
            <span
              aria-hidden="true"
              className="font-display text-foreground/[0.06] absolute inset-0 flex items-center justify-center text-6xl font-medium uppercase tracking-[0.2em]"
            >
              {appConfig.name}
            </span>
          </div>
          <Reveal className="max-w-xl">
            <p className="text-muted-foreground mb-4 text-xs font-medium uppercase tracking-[0.25em]">
              Our Story
            </p>
            <h2
              id="brand-story-heading"
              className="font-display text-foreground text-3xl font-medium leading-tight tracking-tight sm:text-4xl lg:text-5xl"
            >
              Built on craft, restraint, and a respect for detail
            </h2>
            <p className="text-muted-foreground mt-6 text-sm leading-relaxed sm:text-base">
              FWorld is a premium Indian menswear label making considered, long-lasting essentials.
              We work with honest materials and refined construction — fewer, better pieces designed
              to be worn for years, not seasons.
            </p>
            <Button asChild variant="outline" size="lg" className="mt-8">
              <Link href={ROUTES.collections}>
                Discover the label
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

export { BrandStory };
