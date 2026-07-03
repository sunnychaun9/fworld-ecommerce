import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ServerProductListing } from '@/components/catalog/server-product-listing';
import { Container } from '@/components/common/container';
import { Loading } from '@/components/common/loading';
import { PageHeader } from '@/components/layout/page-header';
import { buildMetadata } from '@/config/seo';
import { ROUTES } from '@/constants/routes';

export const metadata: Metadata = buildMetadata({
  title: 'Men',
  description: 'Shop menswear — considered essentials and seasonal edits from FWorld.',
  path: ROUTES.men,
});

export default function MenPage(): React.ReactElement {
  return (
    <>
      <PageHeader
        eyebrow="Shop"
        title="Men"
        description="Considered essentials and seasonal edits, built to last."
      />
      <section className="py-10 sm:py-14">
        <Container>
          <Suspense fallback={<Loading />}>
            <ServerProductListing categorySlug="men" />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
