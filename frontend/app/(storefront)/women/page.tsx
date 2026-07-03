import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ServerProductListing } from '@/components/catalog/server-product-listing';
import { Container } from '@/components/common/container';
import { Loading } from '@/components/common/loading';
import { PageHeader } from '@/components/layout/page-header';
import { buildMetadata } from '@/config/seo';
import { ROUTES } from '@/constants/routes';

export const metadata: Metadata = buildMetadata({
  title: 'Women',
  description: 'Shop womenswear — refined silhouettes and modern staples from FWorld.',
  path: ROUTES.women,
});

export default function WomenPage(): React.ReactElement {
  return (
    <>
      <PageHeader
        eyebrow="Shop"
        title="Women"
        description="Refined silhouettes and modern staples for every day."
      />
      <section className="py-10 sm:py-14">
        <Container>
          <Suspense fallback={<Loading />}>
            <ServerProductListing categorySlug="women" />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
