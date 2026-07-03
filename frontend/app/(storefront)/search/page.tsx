import type { Metadata } from 'next';
import { Suspense } from 'react';

import { SearchView } from '@/components/catalog/search-view';
import { Container } from '@/components/common/container';
import { Loading } from '@/components/common/loading';
import { PageHeader } from '@/components/layout/page-header';
import { buildMetadata } from '@/config/seo';
import { ROUTES } from '@/constants/routes';

export const metadata: Metadata = buildMetadata({
  title: 'Search',
  description: 'Search FWorld products, collections and brands.',
  path: ROUTES.search,
  noIndex: true,
});

export default function SearchPage(): React.ReactElement {
  return (
    <>
      <PageHeader
        eyebrow="Find"
        title="Search"
        description="Search products, brands and categories."
      />
      <section className="py-10 sm:py-14">
        <Container>
          <Suspense fallback={<Loading />}>
            <SearchView />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
