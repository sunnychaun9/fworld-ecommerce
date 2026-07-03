import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Container } from '@/components/common/container';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

import { Reveal } from './reveal';
import { SectionHeading } from './section-heading';

const CATEGORIES = [
  { label: 'Men', href: ROUTES.men },
  { label: 'Women', href: ROUTES.women },
  { label: 'Collections', href: ROUTES.collections },
] as const;

/**
 * Featured category cards (Men / Women / Collections). Elegant, image-free
 * placeholders with a subtle hover treatment. Links resolve to existing shell
 * routes.
 */
function CategoryGrid(): React.ReactElement {
  return (
    <section aria-label="Shop by category" className="py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow="Browse" title="Shop by category" />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CATEGORIES.map((category, index) => (
            <Reveal key={category.label} delay={index * 0.08}>
              <CategoryCard label={category.label} href={category.href} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

function CategoryCard({ label, href }: { label: string; href: string }): React.ReactElement {
  return (
    <Link
      href={href}
      className={cn(
        'bg-muted group relative flex aspect-[4/5] overflow-hidden rounded-lg outline-none',
        'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2',
      )}
    >
      <div
        aria-hidden="true"
        className="from-foreground/[0.07] absolute inset-0 bg-gradient-to-t to-transparent transition-transform duration-500 ease-out group-hover:scale-105"
      />
      <span
        aria-hidden="true"
        className="font-display text-foreground/[0.06] pointer-events-none absolute inset-0 flex items-center justify-center text-7xl font-medium"
      >
        {label}
      </span>
      <div className="relative mt-auto flex w-full items-center justify-between p-5">
        <span className="font-display text-foreground text-xl font-medium">{label}</span>
        <ArrowUpRight className="text-foreground size-5 -translate-x-1 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100" />
      </div>
    </Link>
  );
}

export { CategoryGrid };
