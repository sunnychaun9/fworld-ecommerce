'use client';

import { ArrowRight, Check } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Newsletter sign-up UI. Presentational only — this phase has no backend, so
 * submitting shows an inline confirmation without sending anything.
 */
function NewsletterForm(): React.ReactElement {
  const [submitted, setSubmitted] = React.useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <Check className="text-brand size-4" />
        Thanks — you&apos;re on the list.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm items-center gap-2" noValidate>
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <Input
        id="newsletter-email"
        type="email"
        required
        autoComplete="email"
        placeholder="Email address"
        className="h-11"
      />
      <Button type="submit" size="icon" className="h-11 w-11 shrink-0" aria-label="Subscribe">
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}

export { NewsletterForm };
