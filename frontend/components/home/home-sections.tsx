'use client';

import * as React from 'react';

import { Container } from '@/components/common/container';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { ROUTES } from '@/constants/routes';
import { useHome } from '@/features/home/use-home';

import { CollectionHighlight, CollectionHighlightSkeleton } from './collection-highlight';
import { ProductCarousel, ProductCarouselSkeleton } from './product-carousel';

/**
 * Data-driven middle of the homepage: featured collection, New Arrivals and
 * Best Sellers, sourced from `GET /store/home` via TanStack Query. Owns the
 * loading, error and empty states for these sections; the surrounding static
 * sections render regardless.
 */
function HomeSections(): React.ReactElement {
  const { data, isLoading, isError, refetch } = useHome();

  if (isLoading) {
    return (
      <>
        <CollectionHighlightSkeleton />
        <ProductCarouselSkeleton />
        <ProductCarouselSkeleton />
      </>
    );
  }

  if (isError || !data) {
    return (
      <section className="py-16 sm:py-24">
        <Container>
          <ErrorState
            title="We couldn't load the storefront"
            description="Please check your connection and try again."
            onRetry={() => void refetch()}
          />
        </Container>
      </section>
    );
  }

  const { collections, newArrivals, bestSellers } = data;
  const featuredCollection = collections[0];

  if (!featuredCollection && newArrivals.length === 0 && bestSellers.length === 0) {
    return (
      <section className="py-16 sm:py-24">
        <Container>
          <EmptyState
            title="New arrivals are on their way"
            description="Our catalog is being prepared — please check back soon."
          />
        </Container>
      </section>
    );
  }

  return (
    <>
      {featuredCollection ? <CollectionHighlight collection={featuredCollection} /> : null}
      <ProductCarousel
        eyebrow="Just in"
        title="New Arrivals"
        products={newArrivals}
        viewAllHref={ROUTES.newArrivals}
      />
      <ProductCarousel
        eyebrow="Most wanted"
        title="Best Sellers"
        products={bestSellers}
        viewAllHref={ROUTES.collections}
      />
    </>
  );
}

export { HomeSections };
