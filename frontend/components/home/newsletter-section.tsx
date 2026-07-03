import * as React from 'react';

import { Container } from '@/components/common/container';
import { NewsletterForm } from '@/components/layout/newsletter-form';

/**
 * Premium newsletter band. Reuses the shared newsletter form (UI only — no
 * submission in this phase).
 */
function NewsletterSection(): React.ReactElement {
  return (
    <section aria-labelledby="newsletter-heading" className="py-16 sm:py-24">
      <Container className="flex flex-col items-center text-center">
        <p className="text-muted-foreground mb-4 text-xs font-medium uppercase tracking-[0.25em]">
          Stay in touch
        </p>
        <h2
          id="newsletter-heading"
          className="font-display text-foreground max-w-2xl text-balance text-3xl font-medium tracking-tight sm:text-4xl"
        >
          New arrivals, private events, and considered stories
        </h2>
        <p className="text-muted-foreground mt-4 max-w-md text-sm leading-relaxed">
          Join the list. No noise — just the occasional note worth opening.
        </p>
        <div className="mt-8 flex w-full justify-center">
          <NewsletterForm />
        </div>
      </Container>
    </section>
  );
}

export { NewsletterSection };
