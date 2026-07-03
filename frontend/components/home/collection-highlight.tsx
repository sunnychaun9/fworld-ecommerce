import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Container } from '@/components/common/container';
import { MediaImage } from '@/components/common/media-image';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import type { StoreCollection } from '@/types/catalog';

/**
 * Large editorial highlight for a single featured collection. Image degrades to a
 * neutral placeholder when the collection has none.
 */
function CollectionHighlight({ collection }: { collection: StoreCollection }): React.ReactElement {
  return (
    <section aria-label={`Featured collection: ${collection.name}`} className="py-16 sm:py-24">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="bg-muted relative aspect-[4/5] overflow-hidden rounded-lg sm:aspect-[3/2] lg:aspect-[4/5]">
            <MediaImage
              src={collection.image}
              alt={collection.name}
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
          <div className="max-w-lg">
            <p className="text-muted-foreground mb-4 text-xs font-medium uppercase tracking-[0.25em]">
              Featured Collection
            </p>
            <h2 className="font-display text-foreground text-4xl font-medium tracking-tight sm:text-5xl">
              {collection.name}
            </h2>
            {collection.description ? (
              <p className="text-muted-foreground mt-5 line-clamp-4 text-sm leading-relaxed sm:text-base">
                {collection.description}
              </p>
            ) : null}
            <Button asChild size="lg" className="mt-8">
              <Link href={ROUTES.collections}>
                View collection
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Loading skeleton mirroring the highlight layout. */
function CollectionHighlightSkeleton(): React.ReactElement {
  return (
    <section aria-hidden="true" className="py-16 sm:py-24">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Skeleton className="aspect-[4/5] w-full rounded-lg sm:aspect-[3/2] lg:aspect-[4/5]" />
          <div className="max-w-lg">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-4 h-10 w-3/4" />
            <Skeleton className="mt-5 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
            <Skeleton className="mt-8 h-11 w-40" />
          </div>
        </div>
      </Container>
    </section>
  );
}

export { CollectionHighlight, CollectionHighlightSkeleton };
