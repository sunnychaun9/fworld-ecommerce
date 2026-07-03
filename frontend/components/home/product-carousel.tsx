'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProductCard as ProductCardType } from '@/types/catalog';

import { ProductCard } from './product-card';
import { SectionHeading } from './section-heading';

interface ProductCarouselProps {
  eyebrow?: string;
  title: string;
  products: ProductCardType[];
  viewAllHref?: string;
  viewAllLabel?: string;
}

const ITEM_CLASS = 'w-[75%] shrink-0 snap-start sm:w-[45%] lg:w-[calc(25%-0.75rem)]';
const TRACK_CLASS =
  'flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

/**
 * Horizontally-scrolling product rail. Reused for New Arrivals and Best Sellers.
 * Native scroll-snap drives touch/keyboard scrolling; arrow buttons (sm+) nudge
 * the track. Renders nothing when there are no products (empty handled upstream).
 */
function ProductCarousel({
  eyebrow,
  title,
  products,
  viewAllHref,
  viewAllLabel = 'View all',
}: ProductCarouselProps): React.ReactElement | null {
  const trackRef = React.useRef<HTMLUListElement>(null);

  const scroll = (direction: 1 | -1): void => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  return (
    <section aria-label={title} className="py-12 sm:py-16">
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          action={
            <div className="flex items-center gap-2">
              {viewAllHref ? (
                <Button asChild variant="link" className="px-0">
                  <Link href={viewAllHref}>{viewAllLabel}</Link>
                </Button>
              ) : null}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Scroll left"
                  onClick={() => scroll(-1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Scroll right"
                  onClick={() => scroll(1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          }
        />
        <ul ref={trackRef} className={`mt-8 ${TRACK_CLASS}`}>
          {products.map((product, index) => (
            <li key={product.id} className={ITEM_CLASS}>
              <ProductCard product={product} priority={index < 2} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/** Loading skeleton mirroring the carousel layout. */
function ProductCarouselSkeleton(): React.ReactElement {
  return (
    <section aria-hidden="true" className="py-12 sm:py-16">
      <Container>
        <Skeleton className="h-9 w-56" />
        <ul className={`mt-8 ${TRACK_CLASS}`}>
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className={ITEM_CLASS}>
              <Skeleton className="aspect-[3/4] w-full rounded-md" />
              <Skeleton className="mt-3 h-3 w-20" />
              <Skeleton className="mt-2 h-4 w-3/4" />
              <Skeleton className="mt-2 h-4 w-24" />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export { ProductCarousel, ProductCarouselSkeleton };
